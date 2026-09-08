import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { sendAccessEmail } from "@/lib/mailer";
import type { EmployeeRecord } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return errorResponse(new Error("Missing email"), 400);

    const db = await getDb();
    const collection = db.collection<EmployeeRecord>("employeeRecords");
    const record = await collection.findOne({ email: new RegExp(`^${String(email).trim()}$`, "i") });

    if (!record) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    if (record.passwordSet) {
      return NextResponse.json({ error: "already-set" }, { status: 409 });
    }

    let token = record.setupToken;
    if (!token) {
      token = crypto.randomUUID();
      await collection.updateOne({ id: record.id }, { $set: { setupToken: token } });
    }

    const origin = request.headers.get("origin") ?? `http://${request.headers.get("host") ?? "localhost:3000"}`;
    const { sent } = await sendAccessEmail({
      to: record.email,
      name: record.fullName,
      employeeId: record.id,
      setupUrl: `${origin}/set-password?token=${token}`,
    });

    return NextResponse.json({ sent });
  } catch (error) {
    return errorResponse(error);
  }
}
