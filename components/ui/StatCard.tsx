import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "brand" | "success" | "warning" | "info" | "violet" | "danger";
}) {
  const accentClasses: Record<string, string> = {
    brand: "bg-brand-light text-brand",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    info: "bg-info-bg text-info",
    violet: "bg-violet-bg text-violet",
    danger: "bg-danger-bg text-danger",
  };
  return (
    <Card padded={false} className="h-full min-w-0 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted sm:text-sm">{label}</p>
          <p className="mt-1.5 break-words text-base font-semibold text-foreground sm:mt-2 sm:text-2xl">{value}</p>
          {hint && <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">{hint}</p>}
        </div>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10", accentClasses[accent])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}
