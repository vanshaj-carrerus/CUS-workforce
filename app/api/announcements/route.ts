import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listCollectionResponse, errorResponse } from "@/lib/mongo-helpers";
import { requireRole } from "@/lib/session";
import type { Announcement } from "@/lib/types";

export async function GET() {
  return listCollectionResponse<Announcement>("announcements");
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["hr-admin"]);
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const body = await request.json();

    if (!body.title || !body.content || !body.category) {
      return errorResponse(new Error("Title, content, and category are required"), 400);
    }

    const doc: Announcement = {
      id: `AN-${Date.now()}`,
      title: body.title,
      description: body.description || String(body.content).slice(0, 140),
      content: body.content,
      date: new Date().toISOString().slice(0, 10),
      category: body.category,
      postedBy: body.postedBy || "HR Team",
    };

    const db = await getDb();
    await db.collection("announcements").insertOne({ ...doc });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
