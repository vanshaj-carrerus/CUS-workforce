import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { teamStatusToEmployeeRecord } from "@/lib/attendance-map";
import { createNotification } from "@/lib/notify";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/session";
import type { AttendanceRecord, TeamAttendanceRecord, TeamAttendanceStatus } from "@/lib/types";

const VALID_STATUSES: TeamAttendanceStatus[] = ["full-day", "half-day", "leave", "absent"];

export async function GET(request: Request) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const date = new URL(request.url).searchParams.get("date");
    if (!date) return errorResponse(new Error("Missing date"), 400);

    const db = await getDb();
    const records = await db
      .collection("teamAttendance")
      .find({ date }, { projection: { _id: 0 } })
      .toArray();

    return NextResponse.json(records);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { employeeId, employeeName, date, status } = await request.json();
    if (!employeeId || !date || !VALID_STATUSES.includes(status)) {
      return errorResponse(new Error("Missing or invalid employeeId, date, or status"), 400);
    }

    const db = await getDb();
    await db.collection<TeamAttendanceRecord>("teamAttendance").updateOne(
      { employeeId, date },
      { $set: { employeeId, employeeName: employeeName ?? "", date, status } },
      { upsert: true }
    );

    const employeeRecord = teamStatusToEmployeeRecord(employeeId, date, status);
    await db.collection<AttendanceRecord>("employeeAttendance").updateOne(
      { employeeId, date },
      { $set: employeeRecord },
      { upsert: true }
    );

    try {
      const label = status === "full-day" ? "Full Day" : status === "half-day" ? "Half Day" : status === "leave" ? "Leave" : "Absent";
      await createNotification({
        title: `Attendance marked — ${formatDate(date)}`,
        description: `HR marked you as ${label} for ${formatDate(date)}.`,
        type: "attendance",
        employeeId,
        href: "/attendance",
      });
    } catch {
      // Team mark is already saved.
    }

    return NextResponse.json({ employeeId, employeeName, date, status });
  } catch (error) {
    return errorResponse(error);
  }
}
