import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listCollectionResponse, errorResponse } from "@/lib/mongo-helpers";
import { getSessionUser } from "@/lib/session";
import type { Ticket } from "@/lib/types";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return errorResponse(new Error("Unauthorized"), 401);
  return listCollectionResponse<Ticket>("tickets");
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const body = await request.json();
    const doc: Ticket = {
      id: `HD-${Math.floor(5600 + Math.random() * 400)}`,
      subject: body.subject,
      category: body.category,
      description: body.description,
      priority: body.priority ?? "Medium",
      createdDate: new Date().toISOString().slice(0, 10),
      assignedTo: "Unassigned",
      status: "pending",
      raisedBy: body.raisedBy ?? "Employee",
      raisedById: body.raisedById || undefined,
      source: body.source === "chat" ? "chat" : "form",
      messages: [
        {
          id: "m1",
          author: body.raisedBy ?? "Employee",
          role: "employee",
          message: body.description,
          date: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    const db = await getDb();
    await db.collection("tickets").insertOne({ ...doc });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
