"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Clock, ClipboardCheck, AlertCircle, Users } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea, Label } from "@/components/ui/Field";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { cn, formatDate, monthLabel } from "@/lib/utils";
import { isHrPortalUser } from "@/lib/role-label";
import { isOffDay, normalizeWeekendOff, weekendOffLabel } from "@/lib/weekend-off";
import type { AttendanceStatus, AttendanceRecord, Employee, EmployeeRecord, TeamAttendanceRecord, TeamAttendanceStatus, WeekendOffPattern } from "@/lib/types";
import { monthlyAttendancePercent } from "@/lib/attendance-map";
import type { TodayAttendance } from "@/app/api/attendance/today/route";

interface RosterEmployee {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  weekendOff: WeekendOffPattern;
}

const teamStatusOptions: { status: TeamAttendanceStatus; label: string }[] = [
  { status: "full-day", label: "Full Day" },
  { status: "half-day", label: "Half Day" },
  { status: "leave", label: "Leave" },
  { status: "absent", label: "Absent" },
];

const legend: { status: AttendanceStatus; label: string; color: string }[] = [
  { status: "full-day", label: "Full Day", color: "bg-success" },
  { status: "half-day", label: "Half Day", color: "bg-warning" },
  { status: "absent", label: "Absent", color: "bg-danger" },
  { status: "leave", label: "Leave", color: "bg-violet" },
  { status: "late", label: "Late", color: "bg-warning" },
  { status: "wfh", label: "WFH", color: "bg-info" },
];

const calendarMark: Record<string, { short: string; className: string }> = {
  "full-day": { short: "FD", className: "bg-success-bg text-success border-success/30" },
  present: { short: "FD", className: "bg-success-bg text-success border-success/30" },
  "half-day": { short: "HD", className: "bg-warning-bg text-warning border-warning/30" },
  absent: { short: "AB", className: "bg-danger-bg text-danger border-danger/30" },
  leave: { short: "LV", className: "bg-violet-bg text-violet border-violet/30" },
  late: { short: "LT", className: "bg-warning-bg text-warning border-warning/30" },
  wfh: { short: "WF", className: "bg-info-bg text-info border-info/30" },
  holiday: { short: "", className: "bg-slate-50 text-muted border-border" },
  weekend: { short: "", className: "bg-slate-50 text-muted/70 border-transparent" },
  "not-marked": { short: "", className: "bg-surface text-foreground border-border" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [today, setToday] = useState<TodayAttendance>({ _id: "singleton", checkedIn: false, checkInTime: null, checkOutTime: null });
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("all");

  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [teamDate, setTeamDate] = useState(new Date().toISOString().slice(0, 10));
  const [teamRecords, setTeamRecords] = useState<Record<string, TeamAttendanceStatus>>({});
  const [teamLoading, setTeamLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [weekendOff, setWeekendOff] = useState<WeekendOffPattern>("sunday-only");

  const isHr = isHrPortalUser(user);

  useEffect(() => {
    if (isHr || !user) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiGet<AttendanceRecord[]>(`/api/attendance?employeeId=${encodeURIComponent(user.employeeId)}`),
      apiGet<TodayAttendance>(`/api/attendance/today?employeeId=${encodeURIComponent(user.employeeId)}`),
      apiGet<EmployeeRecord>(`/api/employee-records/${encodeURIComponent(user.employeeId)}`).catch(() => null),
    ])
      .then(([history, todayStatus, record]) => {
        setAttendanceHistory(history);
        setToday(todayStatus);
        if (record) setWeekendOff(normalizeWeekendOff(record.weekendOff));
      })
      .finally(() => setLoading(false));
  }, [isHr, user]);

  useEffect(() => {
    if (!isHr) return;
    Promise.all([apiGet<Employee[]>("/api/employees"), apiGet<EmployeeRecord[]>("/api/employee-records")])
      .then(([canonical, records]) => {
        const fromRecords: RosterEmployee[] = records.map((r) => ({
          employeeId: r.id,
          name: r.fullName,
          department: r.department || "—",
          designation: r.designation || "—",
          weekendOff: normalizeWeekendOff(r.weekendOff),
        }));
        const recordIds = new Set(fromRecords.map((r) => r.employeeId));
        const fromCanonical: RosterEmployee[] = canonical
          .filter((e) => !recordIds.has(e.employeeId))
          .map((e) => ({
            employeeId: e.employeeId,
            name: e.name,
            department: e.department,
            designation: e.designation,
            weekendOff: "sunday-only" as WeekendOffPattern,
          }));
        setRoster([...fromRecords, ...fromCanonical]);
      })
      .finally(() => setRosterLoading(false));
  }, [user, isHr]);

  useEffect(() => {
    if (!isHr) return;
    setTeamLoading(true);
    apiGet<TeamAttendanceRecord[]>(`/api/team-attendance?date=${teamDate}`)
      .then((records) => {
        const map: Record<string, TeamAttendanceStatus> = {};
        records.forEach((r) => {
          map[r.employeeId] = r.status;
        });
        setTeamRecords(map);
      })
      .finally(() => setTeamLoading(false));
  }, [user, teamDate, isHr]);

  async function markTeamAttendance(emp: RosterEmployee, status: TeamAttendanceStatus) {
    setSavingId(emp.employeeId);
    try {
      await apiPost("/api/team-attendance", { employeeId: emp.employeeId, employeeName: emp.name, date: teamDate, status });
      setTeamRecords((prev) => ({ ...prev, [emp.employeeId]: status }));
      showToast(`Marked ${emp.name} as ${teamStatusOptions.find((o) => o.status === status)?.label} for ${formatDate(teamDate)}.`);
    } catch {
      showToast("Failed to update attendance. Please try again.", "warning");
    } finally {
      setSavingId(null);
    }
  }

  const monthlyPct = monthlyAttendancePercent(attendanceHistory, monthFilter);

  const filtered = useMemo(() => {
    return attendanceHistory.filter((r) => {
      if (!r.date.startsWith(monthFilter)) return false;
      if (statusFilter === "present") return r.status === "present" || r.status === "full-day";
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [attendanceHistory, statusFilter, monthFilter]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { value, label: monthLabel(value) };
    });
  }, []);

  const paddedCalendar = useMemo(() => {
    const [y, m] = monthFilter.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const byDate = new Map(attendanceHistory.map((r) => [r.date, r]));
    const cells: Array<AttendanceRecord | { date: string; status: AttendanceStatus } | null> = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (isOffDay(date, weekendOff)) {
        cells.push({ date, checkIn: null, checkOut: null, hours: null, status: "weekend" });
        continue;
      }
      const existing = byDate.get(date);
      if (existing && existing.status !== "weekend") {
        cells.push(existing);
      } else {
        cells.push({ date, checkIn: null, checkOut: null, hours: null, status: "not-marked" });
      }
    }
    return cells;
  }, [attendanceHistory, monthFilter, weekendOff]);

  async function handleCorrectionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittingCorrection(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiPost("/api/attendance/correction", {
        date: form.get("date"),
        reason: form.get("reason"),
        employeeId: user?.employeeId,
        employeeName: user?.name,
      });
      setCorrectionOpen(false);
      showToast("Request sent to HR Helpdesk.");
    } catch {
      showToast("Failed to submit request. Please try again.", "warning");
    } finally {
      setSubmittingCorrection(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHr ? "Team Attendance" : "Attendance"}
        subtitle={isHr ? "Mark daily attendance for every employee" : "See the attendance HR marked for you"}
        action={
          !isHr ? (
            <Button variant="secondary" onClick={() => setCorrectionOpen(true)}>
              <AlertCircle className="h-4 w-4" /> Request Attendance Correction
            </Button>
          ) : undefined
        }
      />

      {!isHr && (
        <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Monthly Attendance" value={`${monthlyPct}%`} icon={ClipboardCheck} hint={monthLabel(monthFilter)} accent="success" />
        <StatCard
          label="Today's Status"
          value={
            today.status === "present" || today.status === "full-day"
              ? "Full Day"
              : today.status === "half-day"
                ? "Half Day"
                : today.status === "leave"
                  ? "Leave"
                  : today.status === "absent"
                    ? "Absent"
                    : today.checkOutTime
                      ? "Completed"
                      : today.checkedIn
                        ? "Checked In"
                        : "Not Checked In"
          }
          icon={Clock}
          accent="info"
        />
        <StatCard label="Working Hours Today" value={today.hours || (today.checkOutTime ? "—" : today.checkedIn ? "In progress" : "—")} icon={Clock} accent="brand" />
      </div>

      <Card className="max-w-sm">
        <CardHeader title="Monthly Calendar" subtitle={`${monthLabel(monthFilter)} · ${weekendOffLabel(weekendOff)}`} />
        <div className="mb-3 flex flex-wrap gap-x-2.5 gap-y-1">
          {legend.map((l) => (
            <div key={l.status} className="flex items-center gap-1 text-[10px] text-muted">
              <span className={cn("h-1.5 w-1.5 rounded-full", l.color)} /> {l.label}
            </div>
          ))}
        </div>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="text-[10px] font-medium text-muted">
                {d}
              </div>
            ))}
            {paddedCalendar.map((r, i) => {
              if (r === null) return <div key={`pad-${i}`} />;
              const mark = calendarMark[r.status] ?? calendarMark["not-marked"];
              return (
                <div
                  key={r.date}
                  className={cn(
                    "flex h-8 flex-col items-center justify-center rounded-md border text-[10px] leading-none",
                    mark.className
                  )}
                  title={
                    r.status === "full-day" || r.status === "present"
                      ? "Full Day"
                      : r.status === "half-day"
                        ? "Half Day"
                        : r.status
                  }
                >
                  <span>{Number(r.date.slice(-2))}</span>
                  {mark.short ? <span className="mt-0.5 font-semibold">{mark.short}</span> : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="mb-3 flex-col items-stretch sm:flex-row sm:items-start" title="Attendance History" subtitle="Detailed daily records" />
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-full min-w-0">
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full min-w-0">
            <option value="all">All Statuses</option>
            <option value="present">Full Day / Present</option>
            <option value="half-day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="wfh">Work From Home</option>
            <option value="leave">Leave</option>
          </Select>
        </div>
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No attendance records found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filtered.map((r) => (
                <div key={r.date} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{formatDate(r.date)}</p>
                    <StatusBadge status={r.status === "present" ? "full-day" : r.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted">
                    <div>
                      <p className="uppercase tracking-wide">Check-in</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.checkIn ?? "—"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide">Check-out</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.checkOut ?? "—"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide">Hours</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.hours ?? "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <TableWrap className="hidden md:block">
              <Table>
                <Thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Check-in</Th>
                    <Th>Check-out</Th>
                    <Th>Working Hours</Th>
                    <Th>Status</Th>
                  </tr>
                </Thead>
                <tbody>
                  {filtered.map((r) => (
                    <Tr key={r.date}>
                      <Td>{formatDate(r.date)}</Td>
                      <Td>{r.checkIn ?? "—"}</Td>
                      <Td>{r.checkOut ?? "—"}</Td>
                      <Td>{r.hours ?? "—"}</Td>
                      <Td>
                        <StatusBadge status={r.status === "present" ? "full-day" : r.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </>
        )}
      </Card>
        </>
      )}

      {isHr && (
        <Card>
          <CardHeader
            title="Team Attendance"
            subtitle="Mark daily attendance for every employee"
            action={
              <Input
                type="date"
                value={teamDate}
                onChange={(e) => setTeamDate(e.target.value)}
                className="w-auto"
              />
            }
          />
          {rosterLoading ? (
            <TableSkeleton />
          ) : roster.length === 0 ? (
            <EmptyState icon={Users} title="No employees found" description="Add employees from Employee Records first." />
          ) : (
            <TableWrap>
              <Table>
                <Thead>
                  <tr>
                    <Th>Employee</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Mark Attendance</Th>
                  </tr>
                </Thead>
                <tbody>
                  {roster.map((emp) => {
                    const current = teamRecords[emp.employeeId];
                    const offToday = isOffDay(teamDate, emp.weekendOff);
                    return (
                      <Tr key={emp.employeeId}>
                        <Td>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted">{emp.designation}</p>
                        </Td>
                        <Td>{emp.department}</Td>
                        <Td>
                          {teamLoading ? (
                            <span className="text-xs text-muted">Loading...</span>
                          ) : offToday ? (
                            <StatusBadge status="weekend" />
                          ) : (
                            <StatusBadge status={current ?? "not-marked"} />
                          )}
                        </Td>
                        <Td>
                          {offToday ? (
                            <p className="text-xs text-muted">Weekly off · {weekendOffLabel(emp.weekendOff)}</p>
                          ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {teamStatusOptions.map((opt) => (
                              <button
                                key={opt.status}
                                disabled={savingId === emp.employeeId}
                                onClick={() => markTeamAttendance(emp, opt.status)}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                                  current === opt.status
                                    ? "border-brand bg-brand-light text-brand-dark"
                                    : "border-border bg-surface text-muted hover:border-brand/40 hover:bg-slate-50"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      )}

      {!isHr && (
      <Modal open={correctionOpen} onClose={() => setCorrectionOpen(false)} title="Request Attendance Correction">
        <form className="space-y-4" onSubmit={handleCorrectionSubmit}>
          <div>
            <Label htmlFor="correction-date">Date</Label>
            <Input id="correction-date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <Label htmlFor="correction-reason">Reason for Correction</Label>
            <Textarea id="correction-reason" name="reason" rows={4} required placeholder="Explain why this attendance record needs correction..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingCorrection}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
