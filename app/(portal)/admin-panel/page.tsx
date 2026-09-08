"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, Check, X, Users, ClipboardCheck, KeyRound, Ban, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { isSuperAdmin } from "@/lib/permissions";
import { roleLabel } from "@/lib/role-label";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { formatDate, countLeaveDays } from "@/lib/utils";
import type { Employee, EmployeeRecord, LeaveRequest, Role } from "@/lib/types";

const roleOptions: Role[] = ["employee", "manager", "hr-admin"];

export default function AdminPanelPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [demoEmployees, setDemoEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [approvals, setApprovals] = useState<LeaveRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allowed = isSuperAdmin(user);

  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      apiGet<Employee[]>("/api/employees"),
      apiGet<EmployeeRecord[]>("/api/employee-records"),
      apiGet<LeaveRequest[]>("/api/leave-approvals"),
    ])
      .then(([demo, recs, pending]) => {
        setDemoEmployees(demo);
        setRecords(recs);
        setApprovals(pending);
      })
      .finally(() => setLoading(false));
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    const timer = setInterval(() => {
      apiGet<LeaveRequest[]>("/api/leave-approvals").then(setApprovals).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [allowed]);

  const hrAdminCount = useMemo(
    () =>
      demoEmployees.filter((e) => e.role === "hr-admin").length +
      records.filter((r) => (r.role ?? "employee") === "hr-admin").length,
    [demoEmployees, records]
  );

  async function decide(id: string, status: "approved" | "rejected") {
    const req = approvals.find((r) => r.id === id);
    setApprovals((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiPatch("/api/leave-approvals", { id, status });
      showToast(`Leave request ${status}.`, status === "approved" ? "success" : "warning");
    } catch {
      if (req) setApprovals((prev) => [req, ...prev]);
      showToast("Failed to update the request. Please try again.", "warning");
    }
  }

  async function handleRoleChange(record: EmployeeRecord, role: Role) {
    setUpdatingId(record.id);
    try {
      const updated = await apiPatch<EmployeeRecord>(`/api/employee-records/${record.id}`, { role });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`${record.fullName} is now ${roleLabel[role]}.`);
    } catch {
      showToast("Failed to update permissions. Please try again.", "warning");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStatus(record: EmployeeRecord) {
    const nextStatus = record.status === "Inactive" ? "Active" : "Inactive";
    setUpdatingId(record.id);
    try {
      const updated = await apiPatch<EmployeeRecord>(`/api/employee-records/${record.id}`, { status: nextStatus });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(
        nextStatus === "Inactive"
          ? `${record.fullName}'s account has been suspended. They can no longer log in.`
          : `${record.fullName}'s account has been reactivated.`
      );
    } catch {
      showToast("Failed to update account status. Please try again.", "warning");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/employee-records/${deleteTarget.id}`);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast(`${deleteTarget.fullName}'s account has been deleted.`);
    } catch {
      showToast("Failed to delete the account. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function leaveDays(r: LeaveRequest) {
    return r.days > 0 ? r.days : countLeaveDays(r.startDate, r.endDate);
  }

  if (!user) return null;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={ShieldAlert}
          title="Restricted Access"
          description="The Admin Panel is only available to the account owner."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" subtitle="Owner-only controls for approvals and access permissions" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Accounts" value={String(demoEmployees.length + records.length)} icon={Users} accent="brand" />
            <StatCard label="Pending Approvals" value={String(approvals.length)} icon={ClipboardCheck} accent="warning" />
            <StatCard label="HR Administrators" value={String(hrAdminCount)} icon={ShieldCheck} accent="success" />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Pending Approvals" subtitle="Leave requests awaiting a decision, across every employee" />
        {loading ? (
          <TableSkeleton rows={2} />
        ) : approvals.length === 0 ? (
          <EmptyState title="No pending approvals" description="You're all caught up." />
        ) : (
          <div className="space-y-3">
            {approvals.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {req.employeeName} <span className="text-muted font-normal">· {req.employeeId}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {req.type} · {formatDate(req.startDate)} — {formatDate(req.endDate)} ({leaveDays(req)} day
                    {leaveDays(req) > 1 ? "s" : ""})
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
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Manage Permissions"
          subtitle="Grant or revoke access, suspend, or permanently delete any employee added through Employee Records or QR onboarding"
        />
        {loading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <EmptyState icon={KeyRound} title="No employee accounts yet." description="Accounts added via Employee Records will appear here." />
        ) : (
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Employee ID</Th>
                  <Th>Full Name</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Access Level</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {records.map((r) => {
                  const isSelf = r.id === user?.employeeId;
                  return (
                    <Tr key={r.id}>
                      <Td className="font-medium">{r.id}</Td>
                      <Td>{r.fullName}</Td>
                      <Td className="text-muted">{r.email}</Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td>
                        <Select
                          value={r.role ?? "employee"}
                          disabled={updatingId === r.id || isSelf}
                          onChange={(e) => handleRoleChange(r, e.target.value as Role)}
                          className="!w-auto !py-1.5 !text-xs"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabel[role]}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td>
                        {isSelf ? (
                          <span className="text-xs text-muted">This is you</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleStatus(r)}
                              disabled={updatingId === r.id}
                              className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground disabled:opacity-50"
                            >
                              {r.status === "Inactive" ? (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5" /> Activate
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" /> Suspend
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(r)}
                              className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
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

      {demoEmployees.length > 0 && (
        <Card>
          <CardHeader title="Demo Accounts" subtitle="Seeded sample logins — access level is fixed and not editable" />
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Employee ID</Th>
                  <Th>Full Name</Th>
                  <Th>Email</Th>
                  <Th>Access Level</Th>
                </tr>
              </Thead>
              <tbody>
                {demoEmployees.map((e) => (
                  <Tr key={e.id}>
                    <Td className="font-medium">{e.employeeId}</Td>
                    <Td>{e.name}</Td>
                    <Td className="text-muted">{e.email}</Td>
                    <Td className="text-muted">{roleLabel[e.role]}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteAccount}
        title="Delete employee account"
        description={
          deleteTarget
            ? `Permanently delete ${deleteTarget.fullName}'s (${deleteTarget.id}) account? They will immediately lose portal access. This cannot be undone.`
            : ""
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />
    </div>
  );
}
