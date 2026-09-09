export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Inclusive calendar days between YYYY-MM-DD dates. */
export function countLeaveDays(startDate: string, endDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return 1;
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

/** Every calendar date (YYYY-MM-DD) from start to end, inclusive. */
export function dateRange(startDate: string, endDate: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return [startDate];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [startDate];

  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "2026-07" → "July 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** "₹1,01,000 + ₹5,000 − ₹1,000" */
export function formatSalaryFormula(base: number, adjustments: Array<{ type: "add" | "cut"; amount: number }>): string {
  const adds = adjustments.filter((a) => a.type === "add").reduce((sum, a) => sum + a.amount, 0);
  const cuts = adjustments.filter((a) => a.type === "cut").reduce((sum, a) => sum + a.amount, 0);
  let formula = formatCurrency(base);
  if (adds) formula += ` + ${formatCurrency(adds)}`;
  if (cuts) formula += ` − ${formatCurrency(cuts)}`;
  return formula;
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
