import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import type { SearchResult } from "@/lib/search-index";

const quickActions: SearchResult[] = [
  { title: "Apply for Leave", category: "Quick Action", href: "/leave" },
  { title: "View Payslip", category: "Quick Action", href: "/payroll" },
  { title: "My Attendance", category: "HR Information", href: "/attendance" },
];

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json([]);

    const db = await getDb();
    const re = new RegExp(q, "i");

    const [documents, announcements, tickets] = await Promise.all([
      db.collection("policyDocuments").find({ name: re }, { projection: { _id: 0 } }).limit(5).toArray(),
      db.collection("announcements").find({ title: re }, { projection: { _id: 0 } }).limit(5).toArray(),
      db.collection("tickets").find({ subject: re }, { projection: { _id: 0 } }).limit(5).toArray(),
    ]);

    const results: SearchResult[] = [
      ...documents.map((d) => ({ title: d.name, category: "Policy Document", href: "/documents" })),
      ...announcements.map((a) => ({ title: a.title, category: "Announcement", href: "/announcements" })),
      ...tickets.map((t) => ({ title: `${t.id} — ${t.subject}`, category: "HR Request", href: `/helpdesk/${t.id}` })),
      ...quickActions.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())),
    ];

    return NextResponse.json(results.slice(0, 8));
  } catch (error) {
    return errorResponse(error);
  }
}
