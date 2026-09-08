"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  CalendarOff,
  ClipboardCheck,
  FileClock,
  LifeBuoy,
  Cake,
  Award,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  HeadcountChart,
  AttendanceTrendChart,
  LeaveTrendChart,
  DepartmentDonutChart,
  HiringAttritionChart,
} from "@/components/charts/AdminCharts";
import { formatDate } from "@/lib/utils";

interface AdminStats {
  summary: {
    totalEmployees: number;
    totalEmployeesHint: string;
    newJoiners: number;
    newJoinersHint: string;
    employeesOnLeave: number;
    attendanceRate: number;
    pendingLeaveRequests: number;
    openHrTickets: number;
  };
  headcountTrend: { month: string; headcount: number }[];
  attendanceTrend: { month: string; rate: number }[];
  leaveTrend: { month: string; days: number }[];
  departmentDistribution: { name: string; value: number }[];
  hiringAttrition: { month: string; hires: number; attrition: number }[];
  recentEmployees: { id: string; name: string; designation: string; department: string; joiningDate: string }[];
  adminPendingApprovals: { id: string; type: string; requester: string; department: string; date: string }[];
  recentHrRequests: { id: string; subject: string; requester: string; status: string; date: string }[];
  upcomingBirthdays: { name: string; date: string; department: string }[];
  upcomingAnniversaries: { name: string; date: string; years: number }[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (user?.role !== "hr-admin") return;
    apiGet<AdminStats>("/api/admin/stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (user.role !== "hr-admin") {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={ShieldAlert}
          title="Restricted Access"
          description="The HR Admin Analytics dashboard is only available to HR Administrators. Contact your HR team if you believe this is a mistake."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="HR Admin Analytics" subtitle="Organization-wide workforce insights" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Employees" value={String(stats.summary.totalEmployees)} icon={Users} hint={stats.summary.totalEmployeesHint} accent="brand" />
            <StatCard label="New Joiners" value={String(stats.summary.newJoiners)} icon={UserPlus} hint={stats.summary.newJoinersHint} accent="success" />
            <StatCard label="Employees on Leave" value={String(stats.summary.employeesOnLeave)} icon={CalendarOff} hint="Today" accent="violet" />
            <StatCard label="Attendance Rate" value={`${stats.summary.attendanceRate}%`} icon={ClipboardCheck} hint="August 2026" accent="info" />
            <StatCard label="Pending Leave Requests" value={String(stats.summary.pendingLeaveRequests)} icon={FileClock} hint="Awaiting approval" accent="warning" />
            <StatCard label="Open HR Tickets" value={String(stats.summary.openHrTickets)} icon={LifeBuoy} hint="Across all departments" accent="danger" />
            <StatCard label="Upcoming Birthdays" value={String(stats.upcomingBirthdays.length)} icon={Cake} hint="Next 30 days" accent="violet" />
            <StatCard label="Work Anniversaries" value={String(stats.upcomingAnniversaries.length)} icon={Award} hint="Next 30 days" accent="success" />
          </>
        )}
      </div>

      {!loading && stats && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Employee Headcount" subtitle="Total headcount over the last 6 months" />
            <HeadcountChart data={stats.headcountTrend} />
          </Card>
          <Card>
            <CardHeader title="Attendance Trends" subtitle="Company-wide attendance rate" />
            <AttendanceTrendChart data={stats.attendanceTrend} />
          </Card>
          <Card>
            <CardHeader title="Leave Trends" subtitle="Total leave days taken per month" />
            <LeaveTrendChart data={stats.leaveTrend} />
          </Card>
          <Card>
            <CardHeader title="Department Distribution" subtitle="Headcount by department" />
            <DepartmentDonutChart data={stats.departmentDistribution} />
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Hiring & Attrition Overview" subtitle="New hires vs. attrition per month" />
            <HiringAttritionChart data={stats.hiringAttrition} />
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent Employees" subtitle="Newest additions to the team" />
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Joined</Th>
                </tr>
              </Thead>
              <tbody>
                {stats?.recentEmployees.map((e) => (
                  <Tr key={e.id}>
                    <Td>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted">
                        {e.id} · {e.designation}
                      </p>
                    </Td>
                    <Td>{e.department}</Td>
                    <Td>{formatDate(e.joiningDate)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader title="Pending Approvals" subtitle="Requests awaiting HR action" />
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Type</Th>
                  <Th>Requester</Th>
                  <Th>Department</Th>
                  <Th>Date</Th>
                </tr>
              </Thead>
              <tbody>
                {stats?.adminPendingApprovals.map((a) => (
                  <Tr key={a.id}>
                    <Td>{a.type}</Td>
                    <Td>{a.requester}</Td>
                    <Td>{a.department}</Td>
                    <Td>{formatDate(a.date)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent HR Requests"
          subtitle="Latest tickets raised across the organization"
          action={
            <Link href="/helpdesk" className="text-sm font-medium text-brand hover:underline">
              View Helpdesk
            </Link>
          }
        />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Ticket ID</Th>
                <Th>Subject</Th>
                <Th>Requester</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <tbody>
              {stats?.recentHrRequests.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium">{r.id}</Td>
                  <Td>{r.subject}</Td>
                  <Td>{r.requester}</Td>
                  <Td>{formatDate(r.date)}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
