import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { createNotification } from "@/lib/notify";
import { formatDate, countLeaveDays, dateRange } from "@/lib/utils";
import { requireRole } from "@/lib/session";
import type { LeaveBalance, LeaveRequest } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireRole(["hr-admin", "manager"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const db = await getDb();
    const [fromApprovals, fromHistory] = await Promise.all([
      db.collection("teamLeaveApprovals").find({ status: "pending" }, { projection: { _id: 0 } }).toArray(),
      db.collection("leaveHistory").find({ status: "pending" }, { projection: { _id: 0 } }).toArray(),
    ]);

    const map = new Map<string, LeaveRequest>();
    for (const doc of [...fromApprovals, ...fromHistory]) {
      const row = doc as unknown as LeaveRequest;
      if (row.id) map.set(row.id, row);
    }

    return NextResponse.json([...map.values()]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["hr-admin", "manager"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id, status } = await request.json();
    if (!id || !["approved", "rejected"].includes(status)) {
      return errorResponse(new Error("Invalid id or status"), 400);
    }

    const db = await getDb();
    await db.collection("teamLeaveApprovals").updateOne({ id }, { $set: { status } });

    const existing = await db.collection("leaveHistory").findOne({ id });
    if (existing) {
      await db.collection("leaveHistory").updateOne({ id }, { $set: { status } });
    } else {
      const fromApproval = await db.collection("teamLeaveApprovals").findOne({ id }, { projection: { _id: 0 } });
      if (fromApproval) {
        await db.collection("leaveHistory").insertOne({ ...fromApproval, status });
      }
    }

    const record = (await db.collection("leaveHistory").findOne({ id }, { projection: { _id: 0 } })) as unknown as LeaveRequest | null;

    if (status === "approved" && record?.employeeId && record.type) {
      try {
        const days = record.days > 0 ? record.days : countLeaveDays(record.startDate, record.endDate);

        const balance = await db
          .collection<LeaveBalance>("leaveBalances")
          .findOne({ employeeId: record.employeeId, type: record.type });
        const remainingBefore = Math.max(0, (balance?.total ?? 0) - (balance?.used ?? 0));
        const paidDays = Math.min(days, remainingBefore);
        const unpaidDays = days - paidDays;

        // Days within the remaining balance are marked "leave" (fully paid in payroll);
        // days beyond it are marked "absent" so payroll counts them as loss-of-pay.
        const dates = dateRange(record.startDate, record.endDate);
        const attendance = db.collection("teamAttendance");
        await Promise.all(
          dates.map((date, i) =>
            attendance.updateOne(
              { employeeId: record.employeeId, date },
              {
                $set: {
                  employeeId: record.employeeId,
                  employeeName: record.employeeName ?? "",
                  date,
                  status: i < paidDays ? "leave" : "absent",
                },
              },
              { upsert: true }
            )
          )
        );

        await db
          .collection<LeaveBalance>("leaveBalances")
          .updateOne(
            { employeeId: record.employeeId, type: record.type },
            { $inc: { used: days }, $setOnInsert: { total: 0 } },
            { upsert: true }
          );

        if (unpaidDays > 0) {
          try {
            await createNotification({
              title: "Leave approved with unpaid days",
              description: `${paidDays} of ${days} day(s) are covered by your ${record.type} balance. The remaining ${unpaidDays} day(s) will be unpaid since your balance is used up.`,
              type: "leave",
              employeeId: record.employeeId,
              href: "/leave",
            });
          } catch {
            // Best-effort notice.
          }
        }
      } catch {
        // Decision is already saved; balance/attendance sync is best-effort.
      }
    }

    if (record?.employeeId) {
      try {
        await createNotification({
          title: status === "approved" ? "Leave request approved" : "Leave request rejected",
          description: `Your ${record.type} (${formatDate(record.startDate)} — ${formatDate(record.endDate)}) was ${status}.`,
          type: "leave",
          employeeId: record.employeeId,
          href: "/leave",
        });
      } catch {
        // Decision is already saved.
      }
    }

    return NextResponse.json({ id, status });
  } catch (error) {
    return errorResponse(error);
  }
}
