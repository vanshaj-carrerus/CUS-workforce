import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { employeeRecordToEmployee } from "@/lib/employee-adapter";
import type { Employee, EmployeeRecord } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const identifier = new URL(request.url).searchParams.get("identifier")?.trim();
    if (!identifier) {
      return errorResponse(new Error("Missing identifier"), 400);
    }
    const re = new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const db = await getDb();

    const canonical = await db
      .collection<Employee>("employees")
      .findOne({ $or: [{ email: re }, { employeeId: re }] }, { projection: { _id: 0 } });
    if (canonical) {
      return NextResponse.json(canonical);
    }

    const record = await db
      .collection<EmployeeRecord>("employeeRecords")
      .findOne({ $or: [{ email: re }, { id: re }] }, { projection: { _id: 0 } });
    if (record && record.status !== "Inactive") {
      return NextResponse.json(employeeRecordToEmployee(record));
    }

    return NextResponse.json({ error: "No matching employee found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}
