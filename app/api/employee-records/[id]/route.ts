import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { createNotification } from "@/lib/notify";
import { formatCurrency } from "@/lib/utils";
import type { EmployeeRecord } from "@/lib/types";
import { normalizeWeekendOff } from "@/lib/weekend-off";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const record = await db
      .collection<EmployeeRecord>("employeeRecords")
      .findOne({ id }, { projection: { _id: 0, passwordHash: 0, setupToken: 0 } });
    if (!record) {
      return errorResponse(new Error("Employee record not found"), 404);
    }
    return NextResponse.json({ ...record, weekendOff: normalizeWeekendOff(record.weekendOff) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Partial<EmployeeRecord> = {};
    const stringFields = [
      "fullName",
      "fatherName",
      "dateOfBirth",
      "mobile",
      "alternateMobile",
      "email",
      "address",
      "designation",
      "department",
      "joiningDate",
    ] as const;
    for (const field of stringFields) {
      if (typeof body[field] === "string") update[field] = body[field];
    }
    if (body.status === "Active" || body.status === "Inactive") update.status = body.status;
    if (body.salary !== undefined) update.salary = Number(body.salary) || 0;
    if (body.weekendOff !== undefined) update.weekendOff = normalizeWeekendOff(body.weekendOff);

    const db = await getDb();
    const collection = db.collection<EmployeeRecord>("employeeRecords");
    const existing = await collection.findOne({ id }, { projection: { salary: 1 } });
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: "after", projection: { _id: 0, passwordHash: 0, setupToken: 0 } }
    );

    if (!result) {
      return errorResponse(new Error("Employee record not found"), 404);
    }

    if (typeof update.salary === "number" && existing && existing.salary !== update.salary) {
      try {
        const wasUnset = !existing.salary;
        await createNotification({
          title: wasUnset ? "Salary added" : "Monthly salary updated",
          description: wasUnset
            ? `Your base monthly salary is ${formatCurrency(update.salary)}.`
            : `Your base monthly salary changed from ${formatCurrency(existing.salary)} to ${formatCurrency(update.salary)}.`,
          type: "payroll",
          employeeId: id,
          href: "/payroll",
        });
      } catch {
        // Record is already updated; skip notify failure.
      }
    }

    return NextResponse.json({ ...result, weekendOff: normalizeWeekendOff(result.weekendOff) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("employeeRecords").deleteOne({ id });

    if (result.deletedCount === 0) {
      return errorResponse(new Error("Employee record not found"), 404);
    }
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
