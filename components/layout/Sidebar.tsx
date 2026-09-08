"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, bottomNav } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-slate-400 group-hover:text-slate-600")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleMain = mainNav.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleMain.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="space-y-1 border-t border-border px-3 py-3">
        {bottomNav.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} onNavigate={onNavigate} />
        ))}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-danger"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  );
}
