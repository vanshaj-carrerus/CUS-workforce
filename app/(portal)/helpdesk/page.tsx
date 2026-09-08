"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Plus, Paperclip, Clock, CircleDot, CheckCircle2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select, Textarea, Label } from "@/components/ui/Field";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { isHrPortalUser } from "@/lib/role-label";
import type { RequestStatus, Ticket } from "@/lib/types";

const statusOptions: RequestStatus[] = ["pending", "in-progress", "resolved"];
const statusLabel: Record<RequestStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
  approved: "Approved",
  rejected: "Rejected",
};

const categoryOptions = ["Payroll Issue", "Leave Issue", "Attendance Correction", "HR Chat", "HR Query", "Document Request", "Benefits", "Other"];

export default function HelpdeskPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHr = isHrPortalUser(user);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTicket, setDeleteTicket] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiGet<Ticket[]>("/api/tickets")
      .then(setTickets)
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      apiGet<Ticket[]>("/api/tickets").then(setTickets).catch(() => {});
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const visibleTickets = useMemo(() => {
    if (isHr) return tickets;
    return tickets.filter((t) => t.raisedBy === user?.name || t.raisedById === user?.employeeId);
  }, [tickets, isHr, user]);

  const chatTickets = useMemo(
    () => visibleTickets.filter((t) => t.category === "HR Chat" || t.source === "chat"),
    [visibleTickets]
  );

  const pendingCount = visibleTickets.filter((t) => t.status === "pending").length;
  const inProgressCount = visibleTickets.filter((t) => t.status === "in-progress").length;
  const resolvedCount = visibleTickets.filter((t) => t.status === "resolved").length;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const newTicket = await apiPost<Ticket>("/api/tickets", {
        category: String(form.get("category")),
        subject: String(form.get("subject")),
        description: String(form.get("description")),
        priority: String(form.get("priority")),
        raisedBy: user?.name ?? "Employee",
        raisedById: user?.employeeId,
      });
      setTickets((prev) => [newTicket, ...prev]);
      setCreateOpen(false);
      showToast("HR request submitted successfully.");
    } catch {
      showToast("Failed to submit request. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(ticket: Ticket, status: RequestStatus) {
    setUpdatingId(ticket.id);
    try {
      const updated = await apiPatch<Ticket>(`/api/tickets/${ticket.id}`, { status });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`${ticket.id} marked as ${statusLabel[status]}.`);
    } catch {
      showToast("Failed to update status. Please try again.", "warning");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTicket) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/tickets/${deleteTicket.id}`);
      setTickets((prev) => prev.filter((t) => t.id !== deleteTicket.id));
      showToast(`${deleteTicket.id} deleted.`);
    } catch {
      showToast("Failed to delete ticket. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteTicket(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Helpdesk"
        subtitle={isHr ? "Every request raised by employees across the company" : "Raise and track requests with the HR team"}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Raise New HR Request
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={String(pendingCount)} icon={Clock} accent="warning" />
        <StatCard label="In Progress" value={String(inProgressCount)} icon={CircleDot} accent="info" />
        <StatCard label="Resolved" value={String(resolvedCount)} icon={CheckCircle2} accent="success" />
      </div>

      {!isHr && chatTickets.length > 0 && (
        <Card>
          <CardHeader title="Chat with HR" subtitle="Previous messages from the chat box — open one to read the full conversation" />
          <div className="space-y-2">
            {chatTickets.map((t) => {
              const last = t.messages[t.messages.length - 1];
              return (
                <Link
                  key={t.id}
                  href={`/helpdesk/${t.id}`}
                  className="block rounded-xl border border-border px-4 py-3 hover:border-brand/40 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{t.subject}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  {last && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {last.author}: {last.message}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted">{t.messages.length} message{t.messages.length === 1 ? "" : "s"}</p>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title={isHr ? "All HR Requests" : "My Requests"}
          subtitle={isHr ? "Every ticket raised by an employee, oldest to newest" : "All your HR helpdesk tickets"}
        />
        {loading ? (
          <TableSkeleton />
        ) : visibleTickets.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No HR tickets yet." description="Raise a request and the HR team will get right on it." />
        ) : (
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Ticket ID</Th>
                  <Th>Subject</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Created Date</Th>
                  <Th>Assigned To</Th>
                  <Th>Status</Th>
                  {isHr && <Th>Actions</Th>}
                </tr>
              </Thead>
              <tbody>
                {visibleTickets.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <Link href={`/helpdesk/${t.id}`} className="font-medium text-brand hover:underline">
                        {t.id}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/helpdesk/${t.id}`} className="hover:underline">
                        {t.subject}
                      </Link>
                    </Td>
                    <Td>{t.raisedBy}</Td>
                    <Td>{t.category}</Td>
                    <Td>{formatDate(t.createdDate)}</Td>
                    <Td>{t.assignedTo}</Td>
                    <Td>
                      {isHr ? (
                        <Select
                          value={t.status}
                          disabled={updatingId === t.id}
                          onChange={(e) => handleStatusChange(t, e.target.value as RequestStatus)}
                          className="!w-auto !py-1.5 !text-xs"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel[s]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </Td>
                    {isHr && (
                      <Td>
                        <button
                          onClick={() => setDeleteTicket(t)}
                          className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTicket}
        onClose={() => setDeleteTicket(null)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        description={`Are you sure you want to delete ${deleteTicket?.id} — "${deleteTicket?.subject}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Raise New HR Request">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <Label htmlFor="category">Request Category</Label>
            <Select id="category" name="category" required defaultValue={categoryOptions[0]}>
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required placeholder="Brief summary of your request" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} required placeholder="Describe your issue or request in detail..." />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="attachment">Attachment (optional)</Label>
            <label
              htmlFor="attachment"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-4 text-sm text-muted hover:border-brand/40"
            >
              <Paperclip className="h-4 w-4" /> Click to attach a file
              <input id="attachment" name="attachment" type="file" className="hidden" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
