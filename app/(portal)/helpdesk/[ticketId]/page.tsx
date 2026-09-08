"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Textarea, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDate } from "@/lib/utils";
import { isHrPortalUser } from "@/lib/role-label";
import type { RequestStatus, Ticket } from "@/lib/types";

const statusOptions: RequestStatus[] = ["pending", "in-progress", "resolved"];

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const isHr = isHrPortalUser(user);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiGet<Ticket>(`/api/tickets/${ticketId}`)
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const updated = await apiPost<Ticket>(`/api/tickets/${ticketId}/messages`, {
        author: user?.name ?? (isHr ? "HR Team" : "Employee"),
        message: reply.trim(),
        role: isHr ? "hr" : "employee",
      });
      setTicket(updated);
      setReply("");
      showToast(isHr ? "Reply sent to employee." : "Message sent to HR.");
    } catch {
      showToast("Failed to send message. Please try again.", "warning");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: RequestStatus) {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiPatch<Ticket>(`/api/tickets/${ticketId}`, { status });
      setTicket(updated);
      showToast(`Ticket marked as ${status.replace("-", " ")}.`);
    } catch {
      showToast("Failed to update status. Please try again.", "warning");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDelete(`/api/tickets/${ticketId}`);
      showToast(`${ticketId} deleted.`);
      router.replace("/helpdesk");
    } catch {
      showToast("Failed to delete ticket. Please try again.", "warning");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link href="/helpdesk" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Helpdesk
        </Link>
        <EmptyState title="Ticket not found" description="This ticket may have been removed or the link is incorrect." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/helpdesk" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Helpdesk
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">{ticket.id}</p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-muted">Raised by {ticket.raisedBy}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CategoryBadge label={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
              {isHr ? (
                <Select
                  value={ticket.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
                  className="!w-auto !py-1.5 !text-xs"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === "in-progress" ? "In Progress" : s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </Select>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted">
            <p>Created {formatDate(ticket.createdDate)}</p>
            <p className="mt-1">Assigned to {ticket.assignedTo}</p>
            {isHr && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-danger hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Ticket
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Conversation" subtitle="Full history of this request" />
        <div className="space-y-4">
          {ticket.messages.map((m) => {
            const isOwnMessage = isHr ? m.role === "hr" : m.role === "employee";
            return (
              <div key={m.id} className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    isOwnMessage ? "bg-brand text-white rounded-tr-sm" : "bg-slate-100 text-foreground rounded-tl-sm"
                  )}
                >
                  <p className="text-sm leading-relaxed">{m.message}</p>
                  <p className={cn("mt-1.5 text-[11px]", isOwnMessage ? "text-white/70" : "text-muted")}>
                    {m.author} · {m.date}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {ticket.status !== "resolved" && (
          <form onSubmit={handleReply} className="mt-5 flex gap-2 border-t border-border pt-5">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={1}
              placeholder={isHr ? "Reply to the employee..." : "Type a reply..."}
              className="flex-1"
            />
            <Button type="submit" loading={sending}>
              <Send className="h-4 w-4" /> Send
            </Button>
          </form>
        )}
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        description={`Are you sure you want to delete ${ticket.id} — "${ticket.subject}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />
    </div>
  );
}
