"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { SidebarContent } from "./Sidebar";

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] animate-fade-in bg-surface shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
