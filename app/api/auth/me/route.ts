import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { employeeRecordToEmployee } from "@/lib/employee-adapter";
import { getSessionUser } from "@/lib/session";
import type { Employee, EmployeeRecord } from "@/lib/types";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return errorResponse(new Error("Not signed in"), 401);
    }

    const db = await getDb();
    const canonical = await db
      .collection<Employee>("employees")
      .findOne({ employeeId: session.employeeId }, { projection: { _id: 0 } });
    if (canonical) return NextResponse.json(canonical);

    const record = await db
      .collection<EmployeeRecord>("employeeRecords")
      .findOne({ id: session.employeeId }, { projection: { _id: 0, passwordHash: 0, setupToken: 0 } });
    if (record) return NextResponse.json(employeeRecordToEmployee(record));

    return errorResponse(new Error("Account no longer exists"), 404);
  } catch (error) {
    return errorResponse(error);
  }
}
