import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import type { Employee } from "@/lib/types";

export async function PATCH(request: Request) {
  try {
    const { role, phone, address } = await request.json();
    if (!role) {
      return errorResponse(new Error("Missing role"), 400);
    }
    const update: Record<string, string> = {};
    if (typeof phone === "string") update.phone = phone;
    if (typeof address === "string") update.address = address;

    const db = await getDb();
    const employees = db.collection<Employee & { _id: string }>("employees");
    await employees.updateOne({ _id: role }, { $set: update });
    const doc = await employees.findOne({ _id: role }, { projection: { _id: 0 } });
    return NextResponse.json(doc);
  } catch (error) {
    return errorResponse(error);
  }
}
