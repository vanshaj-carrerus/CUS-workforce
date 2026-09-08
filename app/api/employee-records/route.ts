import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { sendAccessEmail } from "@/lib/mailer";
import type { EmployeeRecord } from "@/lib/types";
import { normalizeWeekendOff } from "@/lib/weekend-off";

export async function GET() {
  const db = await getDb();
    const docs = await db
      .collection<EmployeeRecord>("employeeRecords")
      .find({}, { projection: { _id: 0, passwordHash: 0, setupToken: 0 } })
      .toArray();
    return NextResponse.json(
      docs.map((doc) => ({
        ...doc,
        weekendOff: normalizeWeekendOff(doc.weekendOff),
      }))
    );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.fullName || !body.mobile || !body.email) {
      return errorResponse(new Error("Full name, mobile number, and email are required"), 400);
    }

    const setupToken = crypto.randomUUID();

    const doc: EmployeeRecord = {
      id: `CT-${Math.floor(4000 + Math.random() * 900)}`,
      fullName: body.fullName,
      fatherName: body.fatherName ?? "",
      dateOfBirth: body.dateOfBirth ?? "",
      mobile: body.mobile,
      alternateMobile: body.alternateMobile ?? "",
      email: body.email,
      address: body.address ?? "",
      designation: body.designation ?? "",
      department: body.department ?? "",
      joiningDate: body.joiningDate ?? new Date().toISOString().slice(0, 10),
      salary: Number(body.salary) || 0,
      weekendOff: normalizeWeekendOff(body.weekendOff),
      status: "Active",
      addedOn: new Date().toISOString().slice(0, 10),
      passwordSet: false,
      setupToken,
    };

    const db = await getDb();
    await db.collection("employeeRecords").insertOne({ ...doc });

    const origin = request.headers.get("origin") ?? `http://${request.headers.get("host") ?? "localhost:3000"}`;
    const { sent } = await sendAccessEmail({
      to: doc.email,
      name: doc.fullName,
      employeeId: doc.id,
      setupUrl: `${origin}/set-password?token=${setupToken}`,
    });

    const { setupToken: _omit, ...safeDoc } = doc;
    return NextResponse.json({ ...safeDoc, emailSent: sent }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
