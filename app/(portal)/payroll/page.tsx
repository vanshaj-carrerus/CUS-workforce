"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  Users,
  UserPlus,
  IndianRupee,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatCurrency, formatSalaryFormula, monthLabel } from "@/lib/utils";
import { weekendOffLabel, normalizeWeekendOff } from "@/lib/weekend-off";
import type { EmployeeRecord, SalaryAdjustment } from "@/lib/types";

type PayrollSummaryRow = {
  employeeId: string;
  salary: number;
  weekendOff: EmployeeRecord["weekendOff"];
  workingDays: number;
  creditedDays: number;
  lopDays: number;
  perDay: number;
  attendancePay: number;
};

function ProtectedAmount({ value, revealed }: { value: string; revealed: boolean }) {
  return (
    <span className={cn("font-semibold transition-all", !revealed && "blur-sm select-none")}>{revealed ? value : "₹ •••••••"}</span>
  );
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthOptions(around = currentMonth()) {
  const [y, m] = around.split("-").map(Number);
  const options: { value: string; label: string }[] = [];
  for (let i = -11; i <= 2; i++) {
    const d = new Date(y, m - 1 + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: monthLabel(value) });
  }
  return options.reverse();
}

export default function PayrollPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([]);
  const [adjustTarget, setAdjustTarget] = useState<EmployeeRecord | null>(null);
  const [adjustMonth, setAdjustMonth] = useState(currentMonth());
  const [targetAllAdjustments, setTargetAllAdjustments] = useState<SalaryAdjustment[]>([]);
  const [adjustType, setAdjustType] = useState<"add" | "cut">("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ownSalary, setOwnSalary] = useState(0);
  const [ownAdjustments, setOwnAdjustments] = useState<SalaryAdjustment[]>([]);
  const [ownSummary, setOwnSummary] = useState<PayrollSummaryRow | null>(null);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummaryRow[]>([]);

  const month = currentMonth();

  useEffect(() => {
    if (user?.role !== "hr-admin") return;
    apiGet<EmployeeRecord[]>("/api/employee-records")
      .then(setEmployeeRecords)
      .finally(() => setRecordsLoading(false));
    apiGet<SalaryAdjustment[]>(`/api/salary-adjustments?month=${month}`).then(setAdjustments);
    apiGet<PayrollSummaryRow[]>(`/api/payroll/summary?month=${month}`).then(setPayrollSummaries);
  }, [user, month]);

  useEffect(() => {
    if (!user) return;
    apiGet<EmployeeRecord>(`/api/employee-records/${user.employeeId}`)
      .then((record) => setOwnSalary(record.salary))
      .catch(() => setOwnSalary(0));
    apiGet<PayrollSummaryRow[]>(`/api/payroll/summary?month=${month}&employeeId=${user.employeeId}`)
      .then((rows) => setOwnSummary(rows[0] ?? null))
      .catch(() => setOwnSummary(null));
    apiGet<SalaryAdjustment[]>(`/api/salary-adjustments?employeeId=${user.employeeId}`)
      .then(setOwnAdjustments)
      .catch(() => setOwnAdjustments([]));
  }, [user, month]);

  function netFor(employeeId: string, list: SalaryAdjustment[]) {
    return list
      .filter((a) => a.employeeId === employeeId)
      .reduce((sum, a) => sum + (a.type === "add" ? a.amount : -a.amount), 0);
  }

  const ownThisMonth = useMemo(
    () => ownAdjustments.filter((a) => a.month === month),
    [ownAdjustments, month]
  );
  const ownNet = useMemo(() => netFor(user?.employeeId ?? "", ownThisMonth), [ownThisMonth, user]);
  const ownAttendancePay = ownSummary?.attendancePay ?? ownSalary;
  const ownPayout = Math.max(0, ownAttendancePay + ownNet);
  const ownHistoryMonths = useMemo(
    () =>
      [...new Set(ownAdjustments.map((a) => a.month))]
        .filter((m) => m !== month)
        .sort()
        .reverse(),
    [ownAdjustments, month]
  );

  const totalMonthlyPayroll = useMemo(() => employeeRecords.reduce((sum, r) => sum + r.salary, 0), [employeeRecords]);
  const totalThisMonthPayout = useMemo(() => {
    const byId = new Map(payrollSummaries.map((row) => [row.employeeId, row.attendancePay]));
    const attendanceTotal = employeeRecords.reduce(
      (sum, r) => sum + (byId.get(r.id) ?? r.salary),
      0
    );
    const totalNet = adjustments.reduce((sum, a) => sum + (a.type === "add" ? a.amount : -a.amount), 0);
    return Math.max(0, attendanceTotal + totalNet);
  }, [employeeRecords, payrollSummaries, adjustments]);

  const targetAdjustments = targetAllAdjustments.filter((a) => a.month === adjustMonth);
  const targetNet = adjustTarget ? netFor(adjustTarget.id, targetAdjustments) : 0;
  const previewPayout = useMemo(() => {
    if (!adjustTarget) return 0;
    const amount = Number(adjustAmount) || 0;
    const delta = adjustType === "add" ? amount : -amount;
    const attendancePay =
      payrollSummaries.find((row) => row.employeeId === adjustTarget.id)?.attendancePay ?? adjustTarget.salary;
    return Math.max(0, attendancePay + targetNet + delta);
  }, [adjustTarget, adjustType, adjustAmount, targetNet, payrollSummaries]);

  function openAdjust(record: EmployeeRecord) {
    setAdjustTarget(record);
    setAdjustMonth(currentMonth());
    setAdjustType("add");
    setAdjustAmount("");
    setTargetAllAdjustments([]);
    apiGet<SalaryAdjustment[]>(`/api/salary-adjustments?employeeId=${record.id}`)
      .then(setTargetAllAdjustments)
      .catch(() => setTargetAllAdjustments([]));
  }

  async function handleAdjustSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjusting(true);
    try {
      const created = await apiPost<SalaryAdjustment>("/api/salary-adjustments", {
        employeeId: adjustTarget.id,
        employeeName: adjustTarget.fullName,
        month: adjustMonth,
        type: adjustType,
        amount: Number(adjustAmount),
        createdBy: user?.name,
      });
      setTargetAllAdjustments((prev) => [...prev, created]);
      if (created.month === month) {
        setAdjustments((prev) => [...prev, created]);
      }
      if (created.employeeId === user?.employeeId) {
        setOwnAdjustments((prev) => [...prev, created]);
      }
      showToast(
        `${adjustType === "add" ? "Added" : "Cut"} ${formatCurrency(Number(adjustAmount))} for ${adjustTarget.fullName} — ${monthLabel(adjustMonth)} only. The employee has been notified.`
      );
      setAdjustAmount("");
    } catch {
      showToast("Failed to apply adjustment. Please try again.", "warning");
    } finally {
      setAdjusting(false);
    }
  }

  async function handleRemoveAdjustment(id: string) {
    setDeletingId(id);
    try {
      await apiDelete(`/api/salary-adjustments/${id}`);
      setTargetAllAdjustments((prev) => prev.filter((a) => a.id !== id));
      setAdjustments((prev) => prev.filter((a) => a.id !== id));
      setOwnAdjustments((prev) => prev.filter((a) => a.id !== id));
      showToast("Adjustment removed.");
    } catch {
      showToast("Failed to remove adjustment. Please try again.", "warning");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="View your salary details and manage employee payroll"
        action={
          <Button variant="secondary" onClick={() => setRevealed((r) => !r)}>
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealed ? "Hide Salary Details" : "Show Salary Details"}
          </Button>
        }
      />

      {ownSalary > 0 && (
        <>
          {ownThisMonth.length > 0 && (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 sm:px-5",
                ownNet >= 0 ? "border-success/20 bg-success-bg" : "border-danger/20 bg-danger-bg"
              )}
            >
              <p className={cn("text-sm font-semibold", ownNet >= 0 ? "text-success" : "text-danger")}>
                {monthLabel(month)} salary is{" "}
                {revealed ? formatSalaryFormula(ownAttendancePay, ownThisMonth) : "₹ •••••••"}
              </p>
              <p className={cn("mt-0.5 text-xs", ownNet >= 0 ? "text-success/80" : "text-danger/80")}>
                HR applied a one-time {ownThisMonth.some((a) => a.type === "add") && ownThisMonth.some((a) => a.type === "cut") ? "adjustment" : ownNet > 0 ? "incentive" : "deduction"} for {monthLabel(month)} only. Your base salary stays the same every month.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">{monthLabel(month)} Payout</p>
                  <p className="mt-2 text-2xl text-foreground">
                    <ProtectedAmount value={formatCurrency(ownPayout)} revealed={revealed} />
                  </p>
                  {ownNet !== 0 ? (
                    <p className={cn("mt-1 text-xs font-medium", ownNet > 0 ? "text-success" : "text-danger")}>
                      {monthLabel(month)} salary is {revealed ? formatSalaryFormula(ownAttendancePay, ownThisMonth) : "₹ •••••••"}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Credited on last working day</p>
                  )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Annual CTC</p>
                  <p className="mt-2 text-2xl text-foreground">
                    <ProtectedAmount value={formatCurrency(ownSalary * 12)} revealed={revealed} />
                  </p>
                  <p className="mt-1 text-xs text-muted">Based on current monthly salary</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={`${monthLabel(month)} salary breakdown`}
              subtitle="Working days from your weekly off, minus LOP, plus any one-time add or cut"
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-muted">Base monthly salary</span>
                <ProtectedAmount value={formatCurrency(ownSalary)} revealed={revealed} />
              </div>
              {ownSummary && (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-muted">Weekly off</span>
                    <span className="text-right text-sm text-foreground">{weekendOffLabel(normalizeWeekendOff(ownSummary.weekendOff))}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-muted">Working days this month</span>
                    <span className="font-medium text-foreground">{ownSummary.workingDays}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-muted">Days credited</span>
                    <span className="font-medium text-foreground">{ownSummary.creditedDays}</span>
                  </div>
                  {ownSummary.lopDays > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span className="text-muted">Loss of pay days</span>
                      <span className="font-medium text-danger">{ownSummary.lopDays}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-muted">Attendance pay</span>
                    <ProtectedAmount value={formatCurrency(ownSummary.attendancePay)} revealed={revealed} />
                  </div>
                </>
              )}
              {ownThisMonth.length === 0 ? (
                <p className="px-1 text-xs text-muted">No incentives or deductions this month.</p>
              ) : (
                ownThisMonth.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-muted">
                      {a.type === "add" ? (
                        <PlusCircle className="h-4 w-4 text-success" />
                      ) : (
                        <MinusCircle className="h-4 w-4 text-danger" />
                      )}
                      {a.type === "add" ? "Incentive / bonus" : "Deduction"}
                      {a.createdBy ? ` · ${a.createdBy}` : ""}
                    </span>
                    <span className={cn("font-semibold", a.type === "add" ? "text-success" : "text-danger")}>
                      {revealed ? `${a.type === "add" ? "+" : "−"} ${formatCurrency(a.amount)}` : "₹ •••••••"}
                    </span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand-light px-4 py-3">
                <span className="font-medium text-brand-dark">{monthLabel(month)} payout</span>
                <span className="font-semibold text-brand-dark">
                  <ProtectedAmount value={formatCurrency(ownPayout)} revealed={revealed} />
                </span>
              </div>
              {ownThisMonth.length > 0 && (
                <p className="px-1 text-xs font-medium text-brand-dark">
                  {monthLabel(month)} salary is {revealed ? formatSalaryFormula(ownAttendancePay, ownThisMonth) : "₹ •••••••"}
                </p>
              )}
            </div>
          </Card>

          {ownHistoryMonths.length > 0 && (
            <Card>
              <CardHeader
                title="Adjustment history"
                subtitle="One-time salary changes HR applied in previous months"
              />
              <div className="space-y-2">
                {ownHistoryMonths.map((m) => {
                  const list = ownAdjustments.filter((a) => a.month === m);
                  const net = list.reduce((sum, a) => sum + (a.type === "add" ? a.amount : -a.amount), 0);
                  const payout = Math.max(0, ownSalary + net);
                  return (
                    <div key={m} className="rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{monthLabel(m)}</p>
                        <p className="text-sm font-semibold text-foreground">
                          <ProtectedAmount value={formatCurrency(payout)} revealed={revealed} />
                        </p>
                      </div>
                      <p className={cn("mt-1 text-xs font-medium", net > 0 ? "text-success" : net < 0 ? "text-danger" : "text-muted")}>
                        {monthLabel(m)} salary is {revealed ? formatSalaryFormula(ownSalary, list) : "₹ •••••••"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {user?.role === "hr-admin" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Employees" value={String(employeeRecords.length)} icon={Users} accent="brand" />
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Total Payroll — {monthLabel(month)}</p>
                  <p className="mt-2 text-2xl text-foreground">
                    <ProtectedAmount value={formatCurrency(totalThisMonthPayout)} revealed={revealed} />
                  </p>
                  <p className="mt-1 text-xs text-muted">Base salaries after attendance LOP + this month&apos;s adjustments</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </div>
            </Card>
            <StatCard
              label="Average Salary"
              value={formatCurrency(employeeRecords.length ? Math.round(totalMonthlyPayroll / employeeRecords.length) : 0)}
              icon={TrendingUp}
              accent="info"
            />
          </div>

          <Card>
            <CardHeader
              title="Employee Salaries"
              subtitle="Pay this month = (monthly salary ÷ working days × days present) plus adjustments. Working days follow each employee’s weekly off."
              action={
                <Link href="/employees">
                  <Button variant="secondary" size="sm">
                    <UserPlus className="h-4 w-4" /> Manage Employees
                  </Button>
                </Link>
              }
            />
            {recordsLoading ? (
              <TableSkeleton />
            ) : employeeRecords.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employee records yet."
                description="Add employees from Employee Records to see their salaries here."
              />
            ) : (
              <TableWrap>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Employee ID</Th>
                      <Th>Full Name</Th>
                      <Th>Designation</Th>
                      <Th>Department</Th>
                      <Th>Weekly off</Th>
                      <Th>Working days</Th>
                      <Th>LOP</Th>
                      <Th>This month pay</Th>
                      <Th>Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {employeeRecords.map((r) => {
                      const net = netFor(r.id, adjustments);
                      const summary = payrollSummaries.find((row) => row.employeeId === r.id);
                      const attendancePay = summary?.attendancePay ?? r.salary;
                      return (
                        <Tr key={r.id}>
                          <Td className="font-medium">{r.id}</Td>
                          <Td>{r.fullName}</Td>
                          <Td>{r.designation || "—"}</Td>
                          <Td>{r.department || "—"}</Td>
                          <Td className="text-xs">{weekendOffLabel(normalizeWeekendOff(r.weekendOff))}</Td>
                          <Td>{summary?.workingDays ?? "—"}</Td>
                          <Td>{summary?.lopDays ? summary.lopDays : "0"}</Td>
                          <Td>
                            <ProtectedAmount value={formatCurrency(Math.max(0, attendancePay + net))} revealed={revealed} />
                            <div className="mt-0.5 text-xs text-muted">
                              Base <ProtectedAmount value={formatCurrency(r.salary)} revealed={revealed} />
                              {net !== 0 && (
                                <span className={cn("ml-1 font-medium", net > 0 ? "text-success" : "text-danger")}>
                                  {net > 0 ? "+" : ""}
                                  {formatCurrency(net)}
                                </span>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <button
                              onClick={() => openAdjust(r)}
                              className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                            </button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Card>
        </>
      )}

      {ownSalary === 0 && user?.role !== "hr-admin" && (
        <EmptyState
          icon={Wallet}
          title="No salary on record yet."
          description="Your HR team hasn't added your salary details yet. Check back soon."
        />
      )}

      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title={`Adjust Salary — ${adjustTarget?.fullName ?? ""}`}
      >
        {adjustTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-muted">Base Monthly Salary (permanent)</span>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{formatCurrency(adjustTarget.salary)}</p>
              <p className="mt-1 text-xs text-muted">
                Adjustments only change the selected month&apos;s payout — the base salary stays the same every month.
              </p>
            </div>

            <div>
              <Label htmlFor="adjust-month">Apply for month</Label>
              <Select
                id="adjust-month"
                value={adjustMonth}
                onChange={(e) => setAdjustMonth(e.target.value)}
              >
                {monthOptions(month).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.value === month ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            </div>

            {targetAdjustments.length > 0 && (
              <div className="space-y-1.5">
                <Label>{monthLabel(adjustMonth)}&apos;s Adjustments</Label>
                {targetAdjustments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className={cn("font-medium", a.type === "add" ? "text-success" : "text-danger")}>
                      {a.type === "add" ? "+" : "-"}
                      {formatCurrency(a.amount)}
                    </span>
                    <button
                      onClick={() => handleRemoveAdjustment(a.id)}
                      disabled={deletingId === a.id}
                      className="text-muted hover:text-danger disabled:opacity-50"
                      aria-label="Remove adjustment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleAdjustSubmit}>
              <div>
                <Label htmlFor="adjust-type">Add Adjustment</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      adjustType === "add"
                        ? "border-success bg-success-bg text-success"
                        : "border-border bg-surface text-muted hover:border-success/40"
                    )}
                  >
                    <PlusCircle className="h-4 w-4" /> Add (Incentive/Bonus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("cut")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      adjustType === "cut"
                        ? "border-danger bg-danger-bg text-danger"
                        : "border-border bg-surface text-muted hover:border-danger/40"
                    )}
                  >
                    <MinusCircle className="h-4 w-4" /> Cut (Deduction)
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="adjust-amount">Amount (₹)</Label>
                <Input
                  id="adjust-amount"
                  type="number"
                  min={0}
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-sm">
                <span className="text-brand-dark">{monthLabel(adjustMonth)}&apos;s Payout (selected month only)</span>
                <p className="mt-0.5 text-lg font-semibold text-brand-dark">{formatCurrency(previewPayout)}</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => setAdjustTarget(null)}>
                  Done
                </Button>
                <Button type="submit" loading={adjusting} disabled={!adjustAmount}>
                  Apply for {monthLabel(adjustMonth)}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
