import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { employeeRecordToEmployee } from "@/lib/employee-adapter";
import type { Employee, EmployeeRecord } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || typeof identifier !== "string") {
      return errorResponse(new Error("Missing identifier"), 400);
    }
    const re = new RegExp(`^${identifier.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const db = await getDb();

    const canonical = await db
      .collection<Employee>("employees")
      .findOne({ $or: [{ email: re }, { employeeId: re }] }, { projection: { _id: 0 } });
    if (canonical) {
      // Seeded demo personas keep frictionless mock login regardless of password.
      return NextResponse.json({ employee: canonical });
    }

    const record = await db
      .collection<EmployeeRecord>("employeeRecords")
      .findOne({ $or: [{ email: re }, { id: re }] });
    if (!record) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    if (!record.passwordSet || !record.passwordHash) {
      return NextResponse.json({ error: "password-not-set", email: record.email }, { status: 403 });
    }

    const valid = await bcrypt.compare(String(password ?? ""), record.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "invalid-password" }, { status: 401 });
    }

    return NextResponse.json({ employee: employeeRecordToEmployee(record) });
  } catch (error) {
    return errorResponse(error);
  }
}
