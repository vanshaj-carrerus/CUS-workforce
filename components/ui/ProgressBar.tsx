import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  trackClassName,
  size = "md",
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped === 100 ? "bg-success" : clamped < 30 ? "bg-danger" : "bg-brand";
  return (
    <div className={cn("w-full rounded-full bg-slate-100", size === "sm" ? "h-1.5" : "h-2", trackClassName)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", color, className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
