import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { countLeaveDays } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const status = url.searchParams.get("status");

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
    const body = await request.json();
    if (!body.employeeId || !body.type || !body.startDate || !body.endDate || !body.reason) {
      return errorResponse(new Error("Missing leave request details"), 400);
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
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
