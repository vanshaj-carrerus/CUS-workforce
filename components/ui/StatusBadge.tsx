import { cn } from "@/lib/utils";

type StatusKind =
  | "pending"
  | "in-progress"
  | "resolved"
  | "approved"
  | "rejected"
  | "present"
  | "absent"
  | "late"
  | "wfh"
  | "holiday"
  | "leave"
  | "weekend"
  | "completed"
  | "not-started"
  | "recommended"
  | "assigned"
  | "Paid"
  | "Processing"
  | "full-day"
  | "half-day"
  | "not-marked";

const config: Record<StatusKind, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "bg-warning-bg text-warning", dot: "bg-warning" },
  "in-progress": { label: "In Progress", className: "bg-info-bg text-info", dot: "bg-info" },
  resolved: { label: "Resolved", className: "bg-success-bg text-success", dot: "bg-success" },
  approved: { label: "Approved", className: "bg-success-bg text-success", dot: "bg-success" },
  rejected: { label: "Rejected", className: "bg-danger-bg text-danger", dot: "bg-danger" },
  present: { label: "Present", className: "bg-success-bg text-success", dot: "bg-success" },
  absent: { label: "Absent", className: "bg-danger-bg text-danger", dot: "bg-danger" },
  late: { label: "Late", className: "bg-warning-bg text-warning", dot: "bg-warning" },
  wfh: { label: "Work From Home", className: "bg-info-bg text-info", dot: "bg-info" },
  holiday: { label: "Holiday", className: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  leave: { label: "Leave", className: "bg-violet-bg text-violet", dot: "bg-violet" },
  weekend: { label: "Weekend", className: "bg-slate-100 text-slate-400", dot: "bg-slate-300" },
  completed: { label: "Completed", className: "bg-success-bg text-success", dot: "bg-success" },
  "not-started": { label: "Not Started", className: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  recommended: { label: "Recommended", className: "bg-violet-bg text-violet", dot: "bg-violet" },
  assigned: { label: "Assigned", className: "bg-info-bg text-info", dot: "bg-info" },
  Paid: { label: "Paid", className: "bg-success-bg text-success", dot: "bg-success" },
  Processing: { label: "Processing", className: "bg-warning-bg text-warning", dot: "bg-warning" },
  "full-day": { label: "Full Day", className: "bg-success-bg text-success", dot: "bg-success" },
  "half-day": { label: "Half Day", className: "bg-warning-bg text-warning", dot: "bg-warning" },
  "not-marked": { label: "Not Marked", className: "bg-slate-100 text-slate-400", dot: "bg-slate-300" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const c = config[status as StatusKind] ?? {
    label: status,
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        c.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function CategoryBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark",
        className
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "Low" | "Medium" | "High" }) {
  const styles = {
    Low: "bg-slate-100 text-slate-500",
    Medium: "bg-warning-bg text-warning",
    High: "bg-danger-bg text-danger",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", styles[priority])}>
      {priority}
    </span>
  );
}
