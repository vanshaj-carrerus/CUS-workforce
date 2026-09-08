import clientPromise from "../lib/mongodb";
import {
  employees,
  leaveHistory,
  teamLeaveApprovals,
  attendanceHistory,
  upcomingHolidays,
  announcements,
  policyDocuments,
  tickets,
  payslips,
  notifications,
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
} from "../lib/data";

const adminSummary = {
  _id: "summary",
  totalEmployees: 0,
  totalEmployeesHint: "+0 this month",
  newJoiners: 0,
  newJoinersHint: "August 2026",
  employeesOnLeave: 0,
  attendanceRate: 0,
  pendingLeaveRequests: 0,
  openHrTickets: 0,
};

const attendanceToday = {
  _id: "singleton",
  checkedIn: true,
  checkInTime: "09:12 AM",
  checkOutTime: null as string | null,
};

async function seed() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const employeeDocs = Object.entries(employees).map(([role, emp]) => ({ ...emp, _id: role }));

  const collections: { name: string; docs: unknown[] }[] = [
    { name: "employees", docs: employeeDocs },
    { name: "leaveHistory", docs: leaveHistory },
    { name: "teamLeaveApprovals", docs: teamLeaveApprovals },
    { name: "attendanceHistory", docs: attendanceHistory },
    { name: "attendanceToday", docs: [attendanceToday] },
    { name: "upcomingHolidays", docs: upcomingHolidays },
    { name: "announcements", docs: announcements },
    { name: "policyDocuments", docs: policyDocuments },
    { name: "tickets", docs: tickets },
    { name: "payslips", docs: payslips },
    { name: "notifications", docs: notifications },
    { name: "headcountTrend", docs: headcountTrend },
    { name: "attendanceTrend", docs: attendanceTrend },
    { name: "leaveTrend", docs: leaveTrend },
    { name: "departmentDistribution", docs: departmentDistribution },
    { name: "hiringAttrition", docs: hiringAttrition },
    { name: "recentEmployees", docs: recentEmployees },
    { name: "adminPendingApprovals", docs: adminPendingApprovals },
    { name: "recentHrRequests", docs: recentHrRequests },
    { name: "upcomingBirthdays", docs: upcomingBirthdays },
    { name: "upcomingAnniversaries", docs: upcomingAnniversaries },
    { name: "adminSummary", docs: [adminSummary] },
  ];

  for (const { name, docs } of collections) {
    const col = db.collection(name);
    await col.deleteMany({});
    if (docs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await col.insertMany(docs as any[]);
    }
    console.log(`Seeded ${name}: ${docs.length} document(s)`);
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
