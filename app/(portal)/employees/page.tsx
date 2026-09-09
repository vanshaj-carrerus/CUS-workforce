"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { UserPlus, ShieldAlert, Phone, Mail, IndianRupee, Pencil, Trash2, QrCode, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, monthLabel } from "@/lib/utils";
import { WEEKEND_OFF_OPTIONS, normalizeWeekendOff, weekendOffLabel, workingDaysInMonth } from "@/lib/weekend-off";
import type { EmployeeRecord, WeekendOffPattern } from "@/lib/types";

function EmployeeForm({
  defaultValues,
  submitting,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: EmployeeRecord;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [weekendOff, setWeekendOff] = useState<WeekendOffPattern>(
    normalizeWeekendOff(defaultValues?.weekendOff)
  );
  const thisMonth = new Date().toISOString().slice(0, 7);
  const workingDays = workingDaysInMonth(thisMonth, weekendOff);
  const selectedHint = WEEKEND_OFF_OPTIONS.find((o) => o.value === weekendOff)?.hint;

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" required placeholder="e.g. Ananya Gupta" defaultValue={defaultValues?.fullName} />
        </div>
        <div>
          <Label htmlFor="fatherName">Father&apos;s Name</Label>
          <Input id="fatherName" name="fatherName" placeholder="e.g. Rakesh Gupta" defaultValue={defaultValues?.fatherName} />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaultValues?.dateOfBirth} />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" required defaultValue={defaultValues?.gender ?? ""}>
            <option value="" disabled>
              Select gender
            </option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </Select>
          <p className="mt-1.5 text-xs text-muted">Sets Annual Leave to 12 days for Female, 7 days for Male.</p>
        </div>
        <div>
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input id="mobile" name="mobile" type="tel" required placeholder="+91 90000 00000" defaultValue={defaultValues?.mobile} />
        </div>
        <div>
          <Label htmlFor="alternateMobile">Alternative Mobile Number</Label>
          <Input id="alternateMobile" name="alternateMobile" type="tel" placeholder="+91 90000 00000" defaultValue={defaultValues?.alternateMobile} />
        </div>
        <div>
          <Label htmlFor="email">Email ID</Label>
          <Input id="email" name="email" type="email" required placeholder="name@custech.co" defaultValue={defaultValues?.email} />
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" name="designation" placeholder="e.g. Software Engineer" defaultValue={defaultValues?.designation} />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" placeholder="e.g. Engineering" defaultValue={defaultValues?.department} />
        </div>
        <div>
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input id="joiningDate" name="joiningDate" type="date" defaultValue={defaultValues?.joiningDate} />
        </div>
        <div>
          <Label htmlFor="salary">Monthly Salary (₹)</Label>
          <Input id="salary" name="salary" type="number" min={0} required placeholder="e.g. 65000" defaultValue={defaultValues?.salary} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="weekendOff">Weekly off</Label>
          <Select
            id="weekendOff"
            name="weekendOff"
            value={weekendOff}
            onChange={(e) => setWeekendOff(normalizeWeekendOff(e.target.value))}
          >
            {WEEKEND_OFF_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-muted">
            {selectedHint} {monthLabel(thisMonth)} has <span className="font-medium text-foreground">{workingDays} working days</span>. Pay is monthly salary ÷ working days × days present (half day = 0.5, absent = LOP).
          </p>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="Full residential address" defaultValue={defaultValues?.address} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function EmployeeRecordsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [viewRecord, setViewRecord] = useState<EmployeeRecord | null>(null);
  const [editRecord, setEditRecord] = useState<EmployeeRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<EmployeeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refreshRecords() {
    return apiGet<EmployeeRecord[]>("/api/employee-records").then(setRecords);
  }

  useEffect(() => {
    if (user?.role !== "hr-admin") return;
    refreshRecords().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Auto-refresh the list while the QR modal is open so newly self-submitted
  // employees show up without HR needing to manually reload.
  useEffect(() => {
    if (!qrOpen) return;
    const interval = setInterval(() => {
      refreshRecords();
    }, 4000);
    return () => clearInterval(interval);
  }, [qrOpen]);

  const onboardUrl = `${origin}/onboard`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(onboardUrl);
      showToast("Onboarding link copied to clipboard.");
    } catch {
      showToast("Couldn't copy the link. Please copy it manually.", "warning");
    }
  }

  if (!user) return null;

  if (user.role !== "hr-admin") {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={ShieldAlert}
          title="Restricted Access"
          description="Employee Records is only available to HR Administrators."
        />
      </div>
    );
  }

  function formToPayload(form: FormData) {
    return {
      fullName: form.get("fullName"),
      fatherName: form.get("fatherName"),
      dateOfBirth: form.get("dateOfBirth"),
      gender: form.get("gender"),
      mobile: form.get("mobile"),
      alternateMobile: form.get("alternateMobile"),
      email: form.get("email"),
      address: form.get("address"),
      designation: form.get("designation"),
      department: form.get("department"),
      joiningDate: form.get("joiningDate"),
      salary: form.get("salary"),
      weekendOff: form.get("weekendOff"),
    };
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newRecord = await apiPost<EmployeeRecord & { emailSent?: boolean }>(
        "/api/employee-records",
        formToPayload(new FormData(e.currentTarget))
      );
      setRecords((prev) => [newRecord, ...prev]);
      setAddOpen(false);
      showToast(
        newRecord.emailSent
          ? "Employee added and portal access emailed to them."
          : "Employee added. Portal access email could not be sent — check email credentials."
      );
    } catch {
      showToast("Failed to add employee. Please check the details and try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRecord) return;
    setSubmitting(true);
    try {
      const updated = await apiPatch<EmployeeRecord>(`/api/employee-records/${editRecord.id}`, formToPayload(new FormData(e.currentTarget)));
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditRecord(null);
      showToast("Employee record updated successfully.");
    } catch {
      showToast("Failed to update employee. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/employee-records/${deleteRecord.id}`);
      setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id));
      showToast("Employee record deleted.");
    } catch {
      showToast("Failed to delete employee. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteRecord(null);
    }
  }

  const totalMonthlyPayroll = records.reduce((sum, r) => sum + r.salary, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        subtitle="Onboard new hires and manage employee details"
        action={
          <>
            <Button variant="secondary" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4" /> Onboard via QR
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add Employee
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Records" value={String(records.length)} icon={UserPlus} accent="brand" />
        <StatCard label="Total Monthly Payroll" value={formatCurrency(totalMonthlyPayroll)} icon={IndianRupee} hint="Sum of all recorded salaries" accent="success" />
        <StatCard label="Active Employees" value={String(records.filter((r) => r.status === "Active").length)} icon={UserPlus} accent="info" />
      </div>

      <Card>
        <CardHeader title="All Employees" subtitle="Full details captured during onboarding" />
        {loading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No employee records yet."
            description="Add your first employee to get started."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" /> Add Employee
              </Button>
            }
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
                  <Th>Mobile</Th>
                  <Th>Salary</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {records.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium">{r.id}</Td>
                    <Td>
                      <p className="font-medium">{r.fullName}</p>
                      <p className="text-xs text-muted">{r.email}</p>
                    </Td>
                    <Td>{r.designation || "—"}</Td>
                    <Td>{r.department || "—"}</Td>
                    <Td>{r.mobile}</Td>
                    <Td>{formatCurrency(r.salary)}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setViewRecord(r)} className="text-sm font-medium text-brand hover:underline">
                          View
                        </button>
                        <button
                          onClick={() => setEditRecord(r)}
                          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteRecord(r)}
                          className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Onboard via QR Code">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-muted">
            Ask the new employee to scan this code with their phone. It opens a self-service form — once they submit,
            their details appear right here automatically.
          </p>
          <div className="mt-5 rounded-2xl border border-border bg-white p-4">
            {origin ? (
              <QRCodeSVG value={onboardUrl} size={200} level="M" />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-muted">Generating...</div>
            )}
          </div>
          <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2">
            <span className="flex-1 truncate text-left text-xs text-muted">{onboardUrl}</span>
            <button onClick={handleCopyLink} className="shrink-0 text-muted hover:text-foreground" aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex w-full gap-2">
            <a href="/onboard" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" className="w-full">
                <ExternalLink className="h-4 w-4" /> Open Form
              </Button>
            </a>
            <Button variant="secondary" onClick={() => refreshRecords()}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Employee" size="lg">
        <EmployeeForm submitting={submitting} submitLabel="Add Employee" onCancel={() => setAddOpen(false)} onSubmit={handleAdd} />
      </Modal>

      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title={`Edit Employee — ${editRecord?.fullName ?? ""}`} size="lg">
        {editRecord && (
          <EmployeeForm
            defaultValues={editRecord}
            submitting={submitting}
            submitLabel="Save Changes"
            onCancel={() => setEditRecord(null)}
            onSubmit={handleEdit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete Employee Record"
        description={`Are you sure you want to delete ${deleteRecord?.fullName ?? "this employee"}? This cannot be undone and will also remove them from Payroll.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title={viewRecord?.fullName ?? ""}>
        {viewRecord && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Employee ID</span>
              <span className="font-medium text-foreground">{viewRecord.id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Father&apos;s Name</span>
              <span className="font-medium text-foreground">{viewRecord.fatherName || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Date of Birth</span>
              <span className="font-medium text-foreground">{viewRecord.dateOfBirth ? formatDate(viewRecord.dateOfBirth) : "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Gender</span>
              <span className="font-medium text-foreground">{viewRecord.gender || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="flex items-center gap-1.5 text-muted">
                <Phone className="h-3.5 w-3.5" /> Mobile
              </span>
              <span className="font-medium text-foreground">{viewRecord.mobile}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="flex items-center gap-1.5 text-muted">
                <Phone className="h-3.5 w-3.5" /> Alternate Mobile
              </span>
              <span className="font-medium text-foreground">{viewRecord.alternateMobile || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="flex items-center gap-1.5 text-muted">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <span className="font-medium text-foreground">{viewRecord.email}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Designation</span>
              <span className="font-medium text-foreground">{viewRecord.designation || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Department</span>
              <span className="font-medium text-foreground">{viewRecord.department || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Joining Date</span>
              <span className="font-medium text-foreground">{viewRecord.joiningDate ? formatDate(viewRecord.joiningDate) : "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Weekly off</span>
              <span className="max-w-[60%] text-right font-medium text-foreground">
                {weekendOffLabel(normalizeWeekendOff(viewRecord.weekendOff))}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted">Address</span>
              <span className="max-w-[60%] text-right font-medium text-foreground">{viewRecord.address || "—"}</span>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <span className="font-semibold text-foreground">Monthly Salary</span>
              <span className="font-semibold text-foreground">{formatCurrency(viewRecord.salary)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
