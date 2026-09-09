import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { getSessionUser } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id } = await params;
    const db = await getDb();

    if (session.role !== "hr-admin") {
      const existing = await db.collection("leaveHistory").findOne({ id }, { projection: { employeeId: 1 } });
      if (existing && existing.employeeId !== session.employeeId) {
        return errorResponse(new Error("Unauthorized"), 401);
      }
    }

    const [history, approvals] = await Promise.all([
      db.collection("leaveHistory").deleteOne({ id }),
      db.collection("teamLeaveApprovals").deleteOne({ id }),
    ]);

    if (history.deletedCount === 0 && approvals.deletedCount === 0) {
      return errorResponse(new Error("Leave request not found"), 404);
    }

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
