import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { teamStatusToEmployeeRecord } from "@/lib/attendance-map";
import { getSessionUser } from "@/lib/session";
import type { AttendanceRecord, TeamAttendanceRecord } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const employeeId = new URL(request.url).searchParams.get("employeeId");
    if (!employeeId) return errorResponse(new Error("Missing employeeId"), 400);

    const session = await getSessionUser();
    if (!session || (session.role !== "hr-admin" && session.employeeId !== employeeId)) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const db = await getDb();
    const [personal, team] = await Promise.all([
      db.collection("employeeAttendance").find({ employeeId }, { projection: { _id: 0 } }).toArray(),
      db.collection("teamAttendance").find({ employeeId }, { projection: { _id: 0 } }).toArray(),
    ]);

    const byDate = new Map<string, AttendanceRecord>();
    for (const row of personal as unknown as AttendanceRecord[]) {
      if (row.date) byDate.set(row.date, row);
    }
    for (const row of team as unknown as TeamAttendanceRecord[]) {
      if (row.date && row.status) {
        byDate.set(row.date, teamStatusToEmployeeRecord(employeeId, row.date, row.status));
      }
    }

    const records = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json(records);
  } catch (error) {
    return errorResponse(error);
  }
}
