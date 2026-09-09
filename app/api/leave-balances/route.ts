import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { getSessionUser, requireRole } from "@/lib/session";
import type { LeaveBalance } from "@/lib/types";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Casual Leave"];

export async function GET(request: Request) {
  try {
    const employeeId = new URL(request.url).searchParams.get("employeeId");
    if (!employeeId) return errorResponse(new Error("Missing employeeId"), 400);

    const session = await getSessionUser();
    if (!session || (session.role !== "hr-admin" && session.employeeId !== employeeId)) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const db = await getDb();
    const existing = await db
      .collection<LeaveBalance>("leaveBalances")
      .find({ employeeId }, { projection: { _id: 0 } })
      .toArray();

    const byType = new Map(existing.map((b) => [b.type, b]));
    const balances = LEAVE_TYPES.map((type) => byType.get(type) ?? { employeeId, type, total: 0, used: 0 });

    return NextResponse.json(balances);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { employeeId, type, total } = await request.json();
    if (!employeeId || !LEAVE_TYPES.includes(type) || typeof total !== "number" || total < 0) {
      return errorResponse(new Error("Invalid employeeId, type, or total"), 400);
    }

    const db = await getDb();
    const result = await db
      .collection<LeaveBalance>("leaveBalances")
      .findOneAndUpdate(
        { employeeId, type },
        { $set: { total }, $setOnInsert: { employeeId, type, used: 0 } },
        { upsert: true, returnDocument: "after", projection: { _id: 0 } }
      );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
