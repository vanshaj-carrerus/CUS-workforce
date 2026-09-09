import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/mongo-helpers";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
