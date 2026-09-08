import { NextResponse } from "next/server";
import { getDb } from "./mongodb";

/** Returns all documents in a collection with the internal _id stripped. */
export async function listCollection<T>(name: string): Promise<T[]> {
  const db = await getDb();
  const docs = await db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
  return docs as T[];
}

export async function listCollectionResponse<T>(name: string) {
  const docs = await listCollection<T>(name);
  return NextResponse.json(docs);
}

export function errorResponse(error: unknown, status = 500) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status });
}
