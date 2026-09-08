import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listCollection, errorResponse } from "@/lib/mongo-helpers";

export async function GET() {
  try {
    const db = await getDb();
    const [
      summary,
      headcountTrend,
      attendanceTrend,
      leaveTrend,
      departmentDistribution,
      hiringAttrition,
      recentEmployees,
      adminPendingApprovals,
      recentHrRequests,
      upcomingBirthdays,
      upcomingAnniversaries,
    ] = await Promise.all([
      db.collection<{ _id: string }>("adminSummary").findOne({ _id: "summary" }, { projection: { _id: 0 } }),
      listCollection("headcountTrend"),
      listCollection("attendanceTrend"),
      listCollection("leaveTrend"),
      listCollection("departmentDistribution"),
      listCollection("hiringAttrition"),
      listCollection("recentEmployees"),
      listCollection("adminPendingApprovals"),
      listCollection("recentHrRequests"),
      listCollection("upcomingBirthdays"),
      listCollection("upcomingAnniversaries"),
    ]);

    return NextResponse.json({
      summary,
      headcountTrend,
      attendanceTrend,
      leaveTrend,
      departmentDistribution,
      hiringAttrition,
      recentEmployees,
      adminPendingApprovals,
      recentHrRequests,
      upcomingBirthdays,
      upcomingAnniversaries,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
