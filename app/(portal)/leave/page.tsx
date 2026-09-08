"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check, X, Upload, Trash2, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select, Textarea, Label } from "@/components/ui/Field";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { CalendarDays, HeartPulse, Coffee, type LucideIcon } from "lucide-react";
import { formatDate, countLeaveDays } from "@/lib/utils";
import type { Employee, EmployeeRecord, LeaveRequest, LeaveBalance } from "@/lib/types";

const leaveTypes = ["Annual Leave", "Sick Leave", "Casual Leave"];
const ALL_EMPLOYEES = "__all__";

const balanceIcons: Record<string, LucideIcon> = {
  "Annual Leave": CalendarDays,
  "Sick Leave": HeartPulse,
  "Casual Leave": Coffee,
};

export default function LeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [approvals, setApprovals] = useState<LeaveRequest[]>([]);
  const [deleteRequest, setDeleteRequest] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [roster, setRoster] = useState<{ id: string; name: string }[]>([]);
  const [balanceTarget, setBalanceTarget] = useState("");
  const [targetBalances, setTargetBalances] = useState<LeaveBalance[]>([]);
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({});
  const [savingType, setSavingType] = useState<string | null>(null);

  const isHr = user?.role === "hr-admin" || user?.role === "manager";

  useEffect(() => {
    if (!user) return;
    const historyUrl = isHr
      ? "/api/leave-history?status=decided"
      : `/api/leave-history?employeeId=${encodeURIComponent(user.employeeId)}`;
    const requests: Promise<unknown>[] = [
      apiGet<LeaveBalance[]>(`/api/leave-balances?employeeId=${encodeURIComponent(user.employeeId)}`),
      apiGet<LeaveRequest[]>(historyUrl),
    ];
    if (isHr) requests.push(apiGet<LeaveRequest[]>("/api/leave-approvals"));

    Promise.all(requests)
      .then((results) => {
        setLeaveBalances(results[0] as LeaveBalance[]);
        setHistory(results[1] as LeaveRequest[]);
        setApprovals(isHr ? (results[2] as LeaveRequest[]) : []);
      })
      .finally(() => setLoading(false));
  }, [user, isHr]);

  useEffect(() => {
    if (!isHr) return;
    Promise.all([apiGet<Employee[]>("/api/employees"), apiGet<EmployeeRecord[]>("/api/employee-records")]).then(
      ([demo, records]) => {
        const combined = [
          ...demo.map((e) => ({ id: e.employeeId, name: e.name })),
          ...records.map((r) => ({ id: r.id, name: r.fullName })),
        ];
        setRoster(combined);
        setBalanceTarget((prev) => prev || ALL_EMPLOYEES);
      }
    );
  }, [isHr]);

  useEffect(() => {
    if (!isHr || !balanceTarget) return;
    if (balanceTarget === ALL_EMPLOYEES) {
      setTargetBalances([]);
      setBalanceDrafts({ "Annual Leave": "", "Sick Leave": "", "Casual Leave": "" });
      return;
    }
    apiGet<LeaveBalance[]>(`/api/leave-balances?employeeId=${encodeURIComponent(balanceTarget)}`).then((balances) => {
      setTargetBalances(balances);
      const drafts: Record<string, string> = {};
      balances.forEach((b) => (drafts[b.type] = String(b.total)));
      setBalanceDrafts(drafts);
    });
  }, [isHr, balanceTarget]);

  useEffect(() => {
    if (!user || !isHr) return;
    const timer = setInterval(() => {
      apiGet<LeaveRequest[]>("/api/leave-approvals").then(setApprovals).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [user, isHr]);

  async function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const newRequest = await apiPost<LeaveRequest>("/api/leave-history", {
        employeeName: user?.name ?? "",
        employeeId: user?.employeeId ?? "",
        type: String(form.get("type")),
        startDate: String(form.get("start")),
        endDate: String(form.get("end")),
        days: Number(form.get("days")) || countLeaveDays(String(form.get("start")), String(form.get("end"))),
        reason: String(form.get("reason")),
      });
      if (isHr) {
        setApprovals((prev) => [newRequest, ...prev]);
      } else {
        setHistory((prev) => [newRequest, ...prev]);
      }
      setApplyOpen(false);
      showToast("Leave application submitted for HR approval.");
    } catch {
      showToast("Failed to submit leave request. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const req = approvals.find((r) => r.id === id);
    setApprovals((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiPatch("/api/leave-approvals", { id, status });
      if (req) setHistory((prev) => [{ ...req, status }, ...prev]);
      showToast(`Leave request ${status}.`, status === "approved" ? "success" : "warning");
    } catch {
      if (req) setApprovals((prev) => [req, ...prev]);
      showToast("Failed to update the request. Please try again.", "warning");
    }
  }

  async function handleSaveBalance(type: string) {
    const total = Number(balanceDrafts[type]);
    if (Number.isNaN(total) || total < 0) {
      showToast("Enter a valid number of days.", "warning");
      return;
    }
    setSavingType(type);
    try {
      if (balanceTarget === ALL_EMPLOYEES) {
        await Promise.all(
          roster.map((r) => apiPatch<LeaveBalance>("/api/leave-balances", { employeeId: r.id, type, total }))
        );
        if (roster.some((r) => r.id === user?.employeeId)) {
          setLeaveBalances((prev) => prev.map((b) => (b.type === type ? { ...b, total } : b)));
        }
        showToast(`${type} total set to ${total} days for all ${roster.length} employees.`);
      } else {
        const updated = await apiPatch<LeaveBalance>("/api/leave-balances", { employeeId: balanceTarget, type, total });
        setTargetBalances((prev) => prev.map((b) => (b.type === type ? updated : b)));
        if (balanceTarget === user?.employeeId) {
          setLeaveBalances((prev) => prev.map((b) => (b.type === type ? updated : b)));
        }
        showToast(`${type} total set to ${total} days.`);
      }
    } catch {
      showToast("Failed to update leave balance. Please try again.", "warning");
    } finally {
      setSavingType(null);
    }
  }

  async function handleDeleteLeave() {
    if (!deleteRequest) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/leave-history/${deleteRequest.id}`);
      setHistory((prev) => prev.filter((r) => r.id !== deleteRequest.id));
      setApprovals((prev) => prev.filter((r) => r.id !== deleteRequest.id));
      showToast("Leave request deleted.");
    } catch {
      showToast("Failed to delete leave request. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteRequest(null);
    }
  }

  function leaveDays(r: LeaveRequest) {
    return r.days > 0 ? r.days : countLeaveDays(r.startDate, r.endDate);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leave and track your requests"
        action={
          <Button onClick={() => setApplyOpen(true)}>
            <CalendarPlus className="h-4 w-4" /> Apply for Leave
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          leaveBalances.map((b) => (
            <StatCard
              key={b.type}
              label={b.type}
              value={`${b.used}/${b.total}`}
              icon={balanceIcons[b.type] ?? CalendarDays}
              hint={`${Math.max(b.total - b.used, 0)} days remaining`}
              accent="brand"
            />
          ))
        )}
      </div>

      {isHr && (
        <Card>
          <CardHeader title="Set Leave Balances" subtitle="Set how many days of each leave type an employee gets this year" />
          <div className="space-y-4">
            <div className="max-w-xs">
              <Label htmlFor="balance-target">Employee</Label>
              <Select id="balance-target" value={balanceTarget} onChange={(e) => setBalanceTarget(e.target.value)}>
                <option value={ALL_EMPLOYEES}>All Employees ({roster.length})</option>
                {roster.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.id}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {leaveTypes.map((type) => {
                const balance = targetBalances.find((b) => b.type === type);
                return (
                  <div key={type} className="rounded-xl border border-border p-3.5">
                    <p className="text-sm font-medium text-foreground">{type}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {balanceTarget === ALL_EMPLOYEES
                        ? "Sets this total for every employee"
                        : balance
                          ? `${balance.used} days already used`
                          : ""}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={balanceDrafts[type] ?? ""}
                        onChange={(e) => setBalanceDrafts((prev) => ({ ...prev, [type]: e.target.value }))}
                        className="!py-1.5"
                      />
                      <button
                        onClick={() => handleSaveBalance(type)}
                        disabled={savingType === type}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {isHr && (
        <Card>
          <CardHeader title="Leave Approvals" subtitle="New applications from employees awaiting your decision" />
          {loading ? (
            <TableSkeleton rows={2} />
          ) : approvals.length === 0 ? (
            <EmptyState title="No pending approvals" description="You're all caught up." />
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {req.employeeName} <span className="text-muted font-normal">· {req.employeeId}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {req.type} · {formatDate(req.startDate)} — {formatDate(req.endDate)} ({leaveDays(req)} day{leaveDays(req) > 1 ? "s" : ""})
                    </p>
                    <p className="mt-1 text-sm text-muted">&ldquo;{req.reason}&rdquo;</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => decide(req.id, "rejected")}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => decide(req.id, "approved")}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteRequest(req)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader
          title="Leave History"
          subtitle={isHr ? "Approved and rejected leave requests" : "Your past and pending leave requests"}
        />
        {loading ? (
          <TableSkeleton />
        ) : history.length === 0 ? (
          <EmptyState title="No leave requests found." />
        ) : (
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  {isHr && <Th>Employee</Th>}
                  <Th>Leave Type</Th>
                  <Th>Dates</Th>
                  <Th>Days</Th>
                  <Th>Applied On</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {history.map((r) => (
                  <Tr key={r.id}>
                    {isHr && (
                      <Td>
                        <p className="font-medium">{r.employeeName || "—"}</p>
                        <p className="text-xs text-muted">{r.employeeId}</p>
                      </Td>
                    )}
                    <Td>{r.type}</Td>
                    <Td>
                      {formatDate(r.startDate)} — {formatDate(r.endDate)}
                    </Td>
                    <Td>{leaveDays(r)}</Td>
                    <Td>{formatDate(r.appliedOn)}</Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td>
                      <button
                        onClick={() => setDeleteRequest(r)}
                        className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Leave">
        <form className="space-y-4" onSubmit={handleApply}>
          <div>
            <Label htmlFor="type">Leave Type</Label>
            <Select id="type" name="type" required defaultValue="Annual Leave">
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Start Date</Label>
              <Input id="start" name="start" type="date" required />
            </div>
            <div>
              <Label htmlFor="end">End Date</Label>
              <Input id="end" name="end" type="date" required />
            </div>
          </div>
          <div>
            <Label htmlFor="days">Number of Days</Label>
            <Input id="days" name="days" type="number" min={1} defaultValue={1} required />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" rows={3} required placeholder="Briefly describe the reason for leave..." />
          </div>
          <div>
            <Label htmlFor="doc">Supporting Document (optional)</Label>
            <label
              htmlFor="doc"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-4 text-sm text-muted hover:border-brand/40"
            >
              <Upload className="h-4 w-4" /> Click to upload a file
              <input id="doc" name="doc" type="file" className="hidden" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!deleteRequest}
        onClose={() => !deleting && setDeleteRequest(null)}
        onConfirm={handleDeleteLeave}
        title="Delete leave request"
        description={
          deleteRequest
            ? `Delete ${deleteRequest.type} from ${formatDate(deleteRequest.startDate)} to ${formatDate(deleteRequest.endDate)}? This cannot be undone.`
            : ""
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />
    </div>
  );
}
