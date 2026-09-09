import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { requireRole } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("salaryAdjustments").deleteOne({ id });

    if (result.deletedCount === 0) {
      return errorResponse(new Error("Adjustment not found"), 404);
    }
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
