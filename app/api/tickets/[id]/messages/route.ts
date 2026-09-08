import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import type { Ticket } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { author, message, role } = await request.json();
    if (!message?.trim()) {
      return errorResponse(new Error("Message is required"), 400);
    }
    const senderRole: "employee" | "hr" = role === "hr" ? "hr" : "employee";
    const newMessage = {
      id: `m-${Date.now()}`,
      author: author ?? (senderRole === "hr" ? "HR Team" : "Employee"),
      role: senderRole,
      message: message.trim(),
      date: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    };

    const db = await getDb();
    const collection = db.collection<Ticket>("tickets");
    const existing = await collection.findOne({ id }, { projection: { status: 1 } });
    if (!existing) {
      return errorResponse(new Error("Ticket not found"), 404);
    }

    // HR replying to a pending ticket naturally moves it into progress.
    const statusUpdate = senderRole === "hr" && existing.status === "pending" ? { status: "in-progress" as const } : {};

    const result = await collection.findOneAndUpdate(
      { id },
      { $push: { messages: newMessage }, $set: statusUpdate },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    if (!result) {
      return errorResponse(new Error("Ticket not found"), 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
