"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarRange, Wallet, Megaphone, GraduationCap, LifeBuoy, Target, CalendarCheck } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";

const iconMap: Record<NotificationItem["type"], typeof Bell> = {
  leave: CalendarRange,
  payroll: Wallet,
  announcement: Megaphone,
  training: GraduationCap,
  ticket: LifeBuoy,
  performance: Target,
  attendance: CalendarCheck,
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(() => {
    if (!user?.employeeId) return;
    apiGet<NotificationItem[]>(`/api/notifications?employeeId=${encodeURIComponent(user.employeeId)}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user?.employeeId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    apiPatch<NotificationItem[]>("/api/notifications", { markAllRead: true, employeeId: user?.employeeId }).catch(() => {});
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    apiPatch<NotificationItem[]>("/api/notifications", { id }).catch(() => {});
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] animate-fade-in rounded-xl border border-border bg-surface shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unread > 0 && (
                <button className="text-xs font-medium text-brand hover:underline" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">No notifications yet.</p>
              ) : (
                items.map((n) => {
                  const Icon = iconMap[n.type];
                  const inner = (
                    <>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.description}</p>
                        <p className="mt-1 text-[11px] text-muted/80">{n.date}</p>
                      </div>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </>
                  );
                  const className = cn(
                    "flex gap-3 border-b border-border px-4 py-3 last:border-b-0",
                    !n.read && "bg-brand-light/40",
                    n.href && "hover:bg-slate-50"
                  );
                  if (n.href) {
                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        className={className}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                      >
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <div key={n.id} className={className}>
                      {inner}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
