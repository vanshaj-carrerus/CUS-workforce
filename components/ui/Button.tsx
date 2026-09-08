import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-dark active:bg-brand-dark shadow-sm shadow-brand/20",
  secondary: "bg-surface text-foreground border border-border hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-foreground hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-danger text-white hover:bg-red-700 active:bg-red-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2 gap-2 rounded-xl",
  lg: "text-sm px-5 py-2.5 gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
