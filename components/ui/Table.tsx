import { cn } from "@/lib/utils";

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>{children}</div>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-[640px] text-left text-sm">{children}</table>;
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">{children}</thead>;
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 text-foreground align-middle", className)}>{children}</td>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-t border-border first:border-t-0 hover:bg-slate-50/70 transition-colors", className)}>{children}</tr>;
}
