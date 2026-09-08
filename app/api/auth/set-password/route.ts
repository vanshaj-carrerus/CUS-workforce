import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import type { EmployeeRecord } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return errorResponse(new Error("Missing token"), 400);

    const db = await getDb();
    const record = await db
      .collection<EmployeeRecord>("employeeRecords")
      .findOne({ setupToken: token }, { projection: { fullName: 1, email: 1, passwordSet: 1 } });

    if (!record) {
      return NextResponse.json({ error: "invalid-token" }, { status: 404 });
    }
    if (record.passwordSet) {
      return NextResponse.json({ error: "already-set" }, { status: 409 });
    }

    return NextResponse.json({ fullName: record.fullName, email: record.email });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return errorResponse(new Error("Missing token or password"), 400);
    }
    if (String(password).length < 6) {
      return errorResponse(new Error("Password must be at least 6 characters"), 400);
    }

    const db = await getDb();
    const collection = db.collection<EmployeeRecord>("employeeRecords");
    const record = await collection.findOne({ setupToken: token });

    if (!record) {
      return NextResponse.json({ error: "invalid-token" }, { status: 404 });
    }
    if (record.passwordSet) {
      return NextResponse.json({ error: "already-set" }, { status: 409 });
    }

    // Keep setupToken on the record (rather than clearing it) so a repeat visit to this link can be
    // recognized as "already activated" instead of looking like an invalid/unknown link.
    const passwordHash = await bcrypt.hash(String(password), 10);
    await collection.updateOne({ id: record.id }, { $set: { passwordHash, passwordSet: true } });

    return NextResponse.json({ ok: true, email: record.email });
  } catch (error) {
    return errorResponse(error);
  }
}
