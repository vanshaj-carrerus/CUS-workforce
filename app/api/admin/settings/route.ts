import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { requireOwner } from "@/lib/session";

interface AdminSettings {
  _id: string;
  email: string;
}

export async function GET() {
  try {
    const session = await requireOwner();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const db = await getDb();
    const doc = await db.collection<AdminSettings>("settings").findOne({ _id: "adminNotifications" });
    return NextResponse.json({ email: doc?.email ?? "" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireOwner();
    if (!session) return errorResponse(new Error("Unauthorized"), 401);
    const { email } = await request.json();
    if (typeof email !== "string") {
      return errorResponse(new Error("Missing email"), 400);
    }

    const db = await getDb();
    await db
      .collection<AdminSettings>("settings")
      .updateOne({ _id: "adminNotifications" }, { $set: { email: email.trim() } }, { upsert: true });

    return NextResponse.json({ email: email.trim() });
  } catch (error) {
    return errorResponse(error);
  }
}
