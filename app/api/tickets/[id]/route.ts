import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { getSessionUser, requireRole } from "@/lib/session";
import type { RequestStatus, Ticket } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const doc = (await db.collection("tickets").findOne({ id }, { projection: { _id: 0 } })) as unknown as Ticket | null;
  if (!doc) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  if (session.role !== "hr-admin" && doc.raisedById !== session.employeeId && doc.raisedBy !== session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(doc);
}

const VALID_STATUSES: RequestStatus[] = ["pending", "in-progress", "resolved"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id } = await params;
    const { status, assignedTo } = await request.json();

    const update: Partial<Ticket> = {};
    if (status && VALID_STATUSES.includes(status)) update.status = status;
    if (typeof assignedTo === "string" && assignedTo.trim()) update.assignedTo = assignedTo.trim();

    if (Object.keys(update).length === 0) {
      return errorResponse(new Error("Nothing to update"), 400);
    }

    const db = await getDb();
    const result = await db
      .collection<Ticket>("tickets")
      .findOneAndUpdate({ id }, { $set: update }, { returnDocument: "after", projection: { _id: 0 } });

    if (!result) {
      return errorResponse(new Error("Ticket not found"), 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("tickets").deleteOne({ id });

    if (result.deletedCount === 0) {
      return errorResponse(new Error("Ticket not found"), 404);
    }
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
