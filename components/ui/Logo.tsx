import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-contrast">
        CT
      </div>
      {!iconOnly && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Custech</p>
          <p className="text-[11px] text-muted -mt-0.5">HR Portal</p>
        </div>
      )}
    </div>
  );
}
