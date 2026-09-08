import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getDb } from "@/lib/mongodb";
import { listCollectionResponse, errorResponse } from "@/lib/mongo-helpers";
import type { PolicyDocument } from "@/lib/types";

export async function GET() {
  return listCollectionResponse<PolicyDocument>("policyDocuments");
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = form.get("name");
    const category = form.get("category");
    const fileType = form.get("fileType");
    const file = form.get("file");

    if (typeof name !== "string" || !name || typeof category !== "string" || !category || typeof fileType !== "string" || !fileType) {
      return errorResponse(new Error("Document name, category, and file type are required"), 400);
    }

    const doc: PolicyDocument = {
      id: `DOC-${Date.now()}`,
      name,
      category,
      lastUpdated: new Date().toISOString().slice(0, 10),
      fileType: fileType as PolicyDocument["fileType"],
      size: "—",
    };

    if (file instanceof File && file.size > 0) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedName = `${doc.id}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

      doc.size = `${(file.size / 1024).toFixed(0)} KB`;
      doc.fileUrl = `/uploads/documents/${storedName}`;
    }

    const db = await getDb();
    await db.collection("policyDocuments").insertOne({ ...doc });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
