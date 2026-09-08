"use client";

import { useState } from "react";
import { Menu, ChevronDown, LogOut, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { roleLabel } from "@/lib/role-label";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-slate-100 hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.initials}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted">{roleLabel[user.role]}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted md:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 animate-fade-in rounded-xl border border-border bg-surface p-1.5 shadow-lg shadow-slate-900/5">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <a href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-slate-50">
                  <UserCog className="h-4 w-4 text-muted" /> My Profile
                </a>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
