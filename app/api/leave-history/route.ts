import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { countLeaveDays } from "@/lib/utils";
import { sendLeaveRequestNotification } from "@/lib/mailer";
import { getSessionUser } from "@/lib/session";
import type { LeaveRequest } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const status = url.searchParams.get("status");

    const session = await getSessionUser();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    if (session.role !== "hr-admin" && employeeId !== session.employeeId) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employeeId = employeeId;
    if (status === "pending") filter.status = "pending";
    if (status === "decided") filter.status = { $in: ["approved", "rejected"] };

    const db = await getDb();
    const records = await db
      .collection("leaveHistory")
      .find(filter, { projection: { _id: 0 } })
      .sort({ appliedOn: -1, id: -1 })
      .toArray();

    return NextResponse.json(records);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const body = await request.json();
    if (!body.employeeId || !body.type || !body.startDate || !body.endDate || !body.reason) {
      return errorResponse(new Error("Missing leave request details"), 400);
    }
    if (session.role !== "hr-admin" && body.employeeId !== session.employeeId) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const doc: LeaveRequest = {
      id: `LR-${Date.now()}`,
      employeeName: body.employeeName ?? "",
      employeeId: body.employeeId,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      days: Number(body.days) || countLeaveDays(body.startDate, body.endDate),
      reason: body.reason,
      appliedOn: new Date().toISOString().slice(0, 10),
      status: "pending",
    };

    const db = await getDb();
    await db.collection("leaveHistory").insertOne({ ...doc });

    try {
      const settings = await db.collection<{ _id: string; email: string }>("settings").findOne({ _id: "adminNotifications" });
      if (settings?.email) {
        await sendLeaveRequestNotification({
          to: settings.email,
          employeeName: doc.employeeName,
          employeeId: doc.employeeId,
          type: doc.type,
          startDate: doc.startDate,
          endDate: doc.endDate,
          days: doc.days,
          reason: doc.reason,
        });
      }
    } catch {
      // Leave request is already saved; notification email is best-effort.
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
