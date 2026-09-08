"use client";

import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id ? "text-brand" : "text-muted hover:text-foreground"
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]",
                active === tab.id ? "bg-brand-light text-brand-dark" : "bg-slate-100 text-muted"
              )}
            >
              {tab.count}
            </span>
          )}
          {active === tab.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  );
}
