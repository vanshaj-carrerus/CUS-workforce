import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { createNotification } from "@/lib/notify";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/types";

export async function GET() {
  try {
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
