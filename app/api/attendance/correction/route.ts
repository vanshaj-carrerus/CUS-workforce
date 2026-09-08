import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { date, reason, employeeId, employeeName } = await request.json();
    if (!date || !reason) {
      return errorResponse(new Error("Missing date or reason"), 400);
    }

    const name = employeeName || "Employee";
    const idLabel = employeeId ? ` (${employeeId})` : "";
    const dateLabel = formatDate(String(date));

    const ticket: Ticket = {
      id: `HD-${Date.now().toString().slice(-6)}`,
      subject: `Attendance correction — ${dateLabel}`,
      category: "Attendance Correction",
      description: `${name}${idLabel} requested an attendance correction for ${dateLabel}.\n\nReason:\n${reason}`,
      priority: "Medium",
      createdDate: new Date().toISOString().slice(0, 10),
      assignedTo: "Unassigned",
      status: "pending",
      raisedBy: name,
      messages: [
        {
          id: "m1",
          author: name,
          role: "employee",
          message: String(reason),
          date: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    const db = await getDb();
    await db.collection("tickets").insertOne({ ...ticket });
    await db.collection("attendanceCorrections").insertOne({
      date,
      reason,
      employeeId: employeeId ?? null,
      employeeName: name,
      ticketId: ticket.id,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
