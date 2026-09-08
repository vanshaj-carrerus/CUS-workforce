import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listCollectionResponse, errorResponse } from "@/lib/mongo-helpers";
import type { NotificationItem } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const db = await getDb();
    const filter = employeeId
      ? {
          $or: [{ employeeId }, { employeeId: { $exists: false } }, { employeeId: null }, { employeeId: "" }],
        }
      : {};

    const records = await db
      .collection("notifications")
      .find(filter, { projection: { _id: 0 } })
      .sort({ date: -1, id: -1 })
      .toArray();

    return NextResponse.json(records);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    if (body.markAllRead) {
      const filter = body.employeeId
        ? {
            $or: [
              { employeeId: body.employeeId },
              { employeeId: { $exists: false } },
              { employeeId: null },
              { employeeId: "" },
            ],
          }
        : {};
      await db.collection("notifications").updateMany(filter, { $set: { read: true } });
    } else if (body.id) {
      await db.collection("notifications").updateOne({ id: body.id }, { $set: { read: true } });
    } else {
      return errorResponse(new Error("Provide either id or markAllRead"), 400);
    }
    return listCollectionResponse<NotificationItem>("notifications");
  } catch (error) {
    return errorResponse(error);
  }
}
