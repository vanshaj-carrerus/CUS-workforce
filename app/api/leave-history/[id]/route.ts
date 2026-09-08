import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
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
