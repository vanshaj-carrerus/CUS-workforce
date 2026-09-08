import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { createNotification } from "@/lib/notify";
import { formatSalaryFormula, monthLabel } from "@/lib/utils";
import type { EmployeeRecord, SalaryAdjustment } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const employeeId = url.searchParams.get("employeeId");
    if (!month && !employeeId) return errorResponse(new Error("Missing month or employeeId"), 400);

    const filter: Record<string, string> = {};
    if (month) filter.month = month;
    if (employeeId) filter.employeeId = employeeId;

    const db = await getDb();
    const records = await db
      .collection<SalaryAdjustment>("salaryAdjustments")
      .find(filter, { projection: { _id: 0 } })
      .toArray();

    return NextResponse.json(records);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, employeeName, month, type, amount, note, createdBy } = await request.json();
    if (!employeeId || !month || (type !== "add" && type !== "cut") || !amount || Number(amount) <= 0) {
      return errorResponse(new Error("Missing or invalid employeeId, month, type, or amount"), 400);
    }

    const doc: SalaryAdjustment = {
      id: `ADJ-${Date.now()}`,
      employeeId,
      employeeName: employeeName ?? "",
      month,
      type,
      amount: Number(amount),
      note: note || undefined,
      createdBy: createdBy ?? "HR",
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection<SalaryAdjustment>("salaryAdjustments").insertOne(doc);

    try {
      const record = await db
        .collection<EmployeeRecord>("employeeRecords")
        .findOne({ id: employeeId }, { projection: { salary: 1 } });
      const monthAdjustments = await db
        .collection<SalaryAdjustment>("salaryAdjustments")
        .find({ employeeId, month }, { projection: { type: 1, amount: 1 } })
        .toArray();
      const base = record?.salary ?? 0;
      const monthName = monthLabel(month);
      const formula = formatSalaryFormula(base, monthAdjustments);
      const kind = type === "add" ? "incentive" : "deduction";

      await createNotification({
        title: `Salary updated for ${monthName}`,
        description: `${monthName} salary is ${formula}. This ${kind} applies to ${monthName} only — your base salary is unchanged.`,
        type: "payroll",
        employeeId,
        href: "/payroll",
      });
    } catch {
      // Adjustment is already saved; skip notify failure.
    }

    return NextResponse.json(doc);
  } catch (error) {
    return errorResponse(error);
  }
}
