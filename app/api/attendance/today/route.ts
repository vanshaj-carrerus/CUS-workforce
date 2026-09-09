import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { getSessionUser } from "@/lib/session";
import type { AttendanceRecord } from "@/lib/types";

export interface TodayAttendance {
  _id?: string;
  employeeId?: string;
  checkedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  hours?: string | null;
  status?: string | null;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const employeeId = new URL(request.url).searchParams.get("employeeId");
    const session = await getSessionUser();
    if (!session || (employeeId && session.employeeId !== employeeId && session.role !== "hr-admin")) {
      return errorResponse(new Error("Unauthorized"), 401);
    }
    const db = await getDb();
    const date = todayDate();

    if (employeeId) {
      const marked = await db
        .collection<AttendanceRecord>("employeeAttendance")
        .findOne({ employeeId, date }, { projection: { _id: 0 } });
      if (marked) {
        return NextResponse.json({
          checkedIn: Boolean(marked.checkIn),
          checkInTime: marked.checkIn,
          checkOutTime: marked.checkOut,
          hours: marked.hours,
          status: marked.status,
        });
      }
    }

    const col = db.collection<TodayAttendance>("attendanceToday");
    const doc = employeeId
      ? await col.findOne({ employeeId }, { projection: { _id: 0 } })
      : await col.findOne({ _id: "singleton" }, { projection: { _id: 0 } });
    return NextResponse.json(
      doc ?? { checkedIn: false, checkInTime: null, checkOutTime: null, hours: null, status: null }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { action, employeeId } = await request.json();
    const session = await getSessionUser();
    if (!session || (employeeId && session.employeeId !== employeeId)) {
      return errorResponse(new Error("Unauthorized"), 401);
    }
    const db = await getDb();
    const col = db.collection<TodayAttendance>("attendanceToday");
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const date = todayDate();
    const key = employeeId ? { employeeId } : { _id: "singleton" };

    if (action === "check-in") {
      const update = { checkedIn: true, checkInTime: now, checkOutTime: null, employeeId: employeeId ?? undefined };
      await col.updateOne(key, { $set: update }, { upsert: true });
      if (employeeId) {
        await db.collection<AttendanceRecord>("employeeAttendance").updateOne(
          { employeeId, date },
          {
            $set: {
              employeeId,
              date,
              checkIn: now,
              checkOut: null,
              hours: null,
              status: "present",
            },
          },
          { upsert: true }
        );
      }
      return NextResponse.json({ ...update, status: "present" });
    }

    if (action === "check-out") {
      await col.updateOne(key, { $set: { checkOutTime: now } });
      const doc = await col.findOne(key, { projection: { _id: 0 } });
      if (employeeId) {
        await db.collection<AttendanceRecord>("employeeAttendance").updateOne(
          { employeeId, date },
          { $set: { checkOut: now, hours: "—", status: "present" } }
        );
      }
      return NextResponse.json({ ...(doc ?? {}), status: "present" });
    }

    return errorResponse(new Error("Invalid action"), 400);
  } catch (error) {
    return errorResponse(error);
  }
}
