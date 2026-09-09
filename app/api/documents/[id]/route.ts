import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { requireRole } from "@/lib/session";
import type { PolicyDocument } from "@/lib/types";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { id } = await params;
    const db = await getDb();
    const doc = await db.collection<PolicyDocument>("policyDocuments").findOne({ id });

    if (!doc) {
      return errorResponse(new Error("Document not found"), 404);
    }

    await db.collection("policyDocuments").deleteOne({ id });

    if (doc.fileUrl) {
      const filePath = path.join(process.cwd(), "public", doc.fileUrl);
      await unlink(filePath).catch(() => {
        // File may already be missing; deleting the record still succeeds.
      });
    }

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
