"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Wallet,
  CalendarCheck,
  LifeBuoy,
  CalendarRange,
  ClipboardCheck,
  FileClock,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api-client";
import type { LeaveBalance, AttendanceRecord, Announcement, Ticket, Payslip } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge, CategoryBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatDate, formatDateLong, formatCurrency } from "@/lib/utils";
import { monthlyAttendancePercent } from "@/lib/attendance-map";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

interface Holiday {
  name: string;
  date: string;
  day: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGet<LeaveBalance[]>("/api/leave-balances"),
      apiGet<AttendanceRecord[]>(`/api/attendance?employeeId=${encodeURIComponent(user.employeeId)}`),
      apiGet<Holiday[]>("/api/holidays"),
      apiGet<Announcement[]>("/api/announcements"),
      apiGet<Ticket[]>("/api/tickets"),
      apiGet<Payslip[]>("/api/payslips"),
    ])
      .then(([balances, attendance, holidays, ann, tix, pay]) => {
        setLeaveBalances(balances);
        setAttendanceHistory(attendance);
        setUpcomingHolidays(holidays);
        setAnnouncements(ann);
        setTickets(tix);
        setPayslips(pay);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const remainingLeave = leaveBalances.reduce((sum, b) => sum + (b.total - b.used), 0);
  const totalLeave = leaveBalances.reduce((sum, b) => sum + b.total, 0);

  const attendancePct = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return monthlyAttendancePercent(attendanceHistory, month);
  }, [attendanceHistory]);

  const myTickets = useMemo(() => tickets.filter((t) => t.raisedBy === user?.name), [tickets, user]);
  const pendingRequests = myTickets.filter((t) => t.status === "pending" || t.status === "in-progress").length;
  const nextPayslip = payslips.find((p) => p.status === "Processing") ?? payslips[0];

  if (!user) return null;

  const quickActions = [
    { label: "Apply Leave", icon: CalendarPlus, href: "/leave" },
    { label: "View Payslip", icon: Wallet, href: "/payroll" },
    { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
    { label: "Raise HR Request", icon: LifeBuoy, href: "/helpdesk" },
  ];

  return (
    <div className="space-y-6">
      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {getGreeting()}, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-muted">Here&apos;s your HR overview.</p>
              <p className="mt-1.5 text-sm text-muted">
                {user.designation} · <span className="text-foreground font-medium">{user.department}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  <action.icon className="h-4 w-4 text-brand" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="stat-card-grid">
        {loading || !nextPayslip ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Leave Balance" value={`${remainingLeave} / ${totalLeave} days`} icon={CalendarRange} hint="Remaining this year" accent="violet" />
            <StatCard label="Attendance %" value={`${attendancePct}%`} icon={ClipboardCheck} hint="This month" accent="success" />
            <StatCard label="Pending Requests" value={String(pendingRequests)} icon={FileClock} hint="Across HR helpdesk" accent="warning" />
            <StatCard label="Next Payslip" value={formatCurrency(nextPayslip.netSalary)} icon={Wallet} hint={`Processing on ${formatDate(nextPayslip.payDate)}`} accent="brand" />
          </>
        )}
      </div>

      <Card padded={false} className="px-4 py-3 sm:px-5 sm:py-4">
        <CardHeader
          className="mb-1.5"
          title="Upcoming Holidays"
          action={
            upcomingHolidays.length > 2 ? (
              <button
                type="button"
                onClick={() => setShowAllHolidays((open) => !open)}
                className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                {showAllHolidays ? "View less" : "View more"}
              </button>
            ) : undefined
          }
        />
        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8">
          {(showAllHolidays ? upcomingHolidays : upcomingHolidays.slice(0, 2)).map((h) => (
            <div key={h.name} className="border-b border-border py-2 last:border-b-0 [&:nth-last-child(-n+2)]:border-b-0">
              <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDate(h.date)} · {h.day.slice(0, 3)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="HR Announcements"
            subtitle="Latest updates from HR"
            action={
              <Link href="/announcements" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-xl border border-border p-4 transition-colors hover:border-brand/30">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <CategoryBadge label={a.category} />
                  <span className="text-xs text-muted">{formatDate(a.date)}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="My HR Requests"
            subtitle="Track the status of your open requests"
            action={
              <Link href="/helpdesk" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {myTickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No HR requests yet.</p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.id} · {formatDateLong(t.createdDate).split(",")[0]}, {t.createdDate.slice(0, 4)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
