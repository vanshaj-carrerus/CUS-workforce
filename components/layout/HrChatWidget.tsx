"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { isHrPortalUser } from "@/lib/role-label";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/Modal";
import type { Ticket } from "@/lib/types";

export const HR_CHAT_CATEGORY = "HR Chat";
export const OPEN_HR_CHAT_EVENT = "custech:open-hr-chat";

function storageKey(employeeId: string) {
  return `custech-hr-chat-${employeeId}`;
}

function readSavedTicketId(employeeId: string) {
  try {
    return window.localStorage.getItem(storageKey(employeeId));
  } catch {
    return null;
  }
}

function writeSavedTicketId(employeeId: string, ticketId: string) {
  try {
    window.localStorage.setItem(storageKey(employeeId), ticketId);
  } catch {
    // ignore
  }
}

function clearSavedTicketId(employeeId: string) {
  try {
    window.localStorage.removeItem(storageKey(employeeId));
  } catch {
    // ignore
  }
}

function dismissedKey(employeeId: string) {
  return `custech-hr-chat-dismissed-${employeeId}`;
}

function readDismissedIds(employeeId: string): string[] {
  try {
    const raw = window.localStorage.getItem(dismissedKey(employeeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function dismissTicketId(employeeId: string, ticketId: string) {
  try {
    const next = Array.from(new Set([...readDismissedIds(employeeId), ticketId]));
    window.localStorage.setItem(dismissedKey(employeeId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function HrChatWidget() {
  const { user } = useAuth();
  const isHr = isHrPortalUser(user);
  const [open, setOpen] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<Ticket | null>(null);
  ticketRef.current = ticket;

  const loadChat = useCallback(async () => {
    if (!user) return ticketRef.current;
    const dismissed = new Set(readDismissedIds(user.employeeId));
    const savedId = readSavedTicketId(user.employeeId);
    if (savedId && !dismissed.has(savedId)) {
      try {
        const saved = await apiGet<Ticket>(`/api/tickets/${savedId}`);
        if (saved?.id) return saved;
      } catch {
        // fall through to list search
      }
    }
    const tickets = await apiGet<Ticket[]>("/api/tickets");
    const mine = tickets.filter(
      (t) =>
        (t.category === HR_CHAT_CATEGORY || t.source === "chat") &&
        (t.raisedById === user.employeeId || t.raisedBy === user.name) &&
        !dismissed.has(t.id)
    );
    mine.sort((a, b) => b.id.localeCompare(a.id));
    return mine.find((t) => t.status !== "resolved") ?? mine[0] ?? null;
  }, [user]);

  useEffect(() => {
    if (isHr || !user) return;
    loadChat()
      .then((next) => {
        if (!next) return;
        writeSavedTicketId(user.employeeId, next.id);
        setTicket(next);
      })
      .catch(() => {});
  }, [isHr, user, loadChat]);

  useEffect(() => {
    if (isHr || !open || !user) return;
    loadChat()
      .then((next) => {
        if (!next) return;
        writeSavedTicketId(user.employeeId, next.id);
        setTicket(next);
      })
      .catch(() => {});

    const timer = setInterval(() => {
      loadChat()
        .then((next) => {
          if (!next) return;
          setTicket((prev) => {
            if (prev && next.messages.length > prev.messages.length) {
              const last = next.messages[next.messages.length - 1];
              if (last?.role === "hr") setUnread(true);
            }
            return next;
          });
        })
        .catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [isHr, open, user, loadChat]);

  useEffect(() => {
    if (!open) return;
    setUnread(false);
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [open, ticket?.messages.length]);

  useEffect(() => {
    if (isHr) return;
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_HR_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_HR_CHAT_EVENT, handler);
  }, [isHr]);

  if (isHr || !user) return null;

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !user) return;
    setSending(true);
    try {
      const current = ticketRef.current;
      if (!current || current.status === "resolved") {
        const created = await apiPost<Ticket>("/api/tickets", {
          category: HR_CHAT_CATEGORY,
          subject: `Chat with HR — ${user.name}`,
          description: text,
          priority: "Medium",
          raisedBy: user.name,
          raisedById: user.employeeId,
          source: "chat",
        });
        writeSavedTicketId(user.employeeId, created.id);
        setTicket(created);
      } else {
        const updated = await apiPost<Ticket>(`/api/tickets/${current.id}/messages`, {
          author: user.name,
          message: text,
          role: "employee",
        });
        writeSavedTicketId(user.employeeId, updated.id);
        setTicket(updated);
      }
      setDraft("");
    } catch {
      // keep draft so they can retry
    } finally {
      setSending(false);
    }
  }

  function handleDeleteConversation() {
    const current = ticketRef.current;
    if (!current || !user) {
      setConfirmDelete(false);
      return;
    }
    dismissTicketId(user.employeeId, current.id);
    clearSavedTicketId(user.employeeId);
    setTicket(null);
    ticketRef.current = null;
    setDraft("");
    setConfirmDelete(false);
  }

  return (
    <>
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-slate-900/15">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-brand-contrast">
            <div>
              <p className="text-sm font-semibold">Chat with HR</p>
              <p className="text-[11px] text-white/80">History stays in Helpdesk too</p>
            </div>
            <div className="flex items-center gap-1">
              {ticket && ticket.messages.length > 0 && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg p-1 hover:bg-white/15"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-white/15"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
            {(!ticket || ticket.messages.length === 0) && (
              <p className="px-2 py-8 text-center text-xs text-muted">
                Send a message and it will appear in HR Helpdesk.
              </p>
            )}
            {ticket?.messages.map((m) => {
              const mine = m.role === "employee";
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "rounded-tr-sm bg-brand text-white" : "rounded-tl-sm bg-white text-foreground border border-border"
                    )}
                  >
                    <p className="leading-relaxed">{m.message}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-muted")}>{m.date}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border bg-surface p-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
        aria-label="Chat with HR"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread && <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-danger" />}
      </button>
    </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConversation}
        title="Clear this chat"
        description="This only clears the chat bubble. Your request stays on HR Helpdesk."
        confirmLabel="Clear chat"
        danger
      />
    </>
  );
}
