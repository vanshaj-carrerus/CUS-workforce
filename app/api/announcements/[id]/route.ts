import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import type { Announcement } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Partial<Announcement> = {};
    const stringFields = ["title", "description", "content", "category", "postedBy"] as const;
    for (const field of stringFields) {
      if (typeof body[field] === "string" && body[field].trim()) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return errorResponse(new Error("Nothing to update"), 400);
    }

    const db = await getDb();
    const result = await db
      .collection<Announcement>("announcements")
      .findOneAndUpdate({ id }, { $set: update }, { returnDocument: "after", projection: { _id: 0 } });

    if (!result) {
      return errorResponse(new Error("Announcement not found"), 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("announcements").deleteOne({ id });

    if (result.deletedCount === 0) {
      return errorResponse(new Error("Announcement not found"), 404);
    }
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
