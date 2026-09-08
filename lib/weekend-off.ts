import type { AttendanceRecord, AttendanceStatus, WeekendOffPattern } from "./types";

export const WEEKEND_OFF_OPTIONS: { value: WeekendOffPattern; label: string; hint: string }[] = [
  {
    value: "sunday-only",
    label: "Only Sunday off",
    hint: "Every Sunday is off. Saturdays are working days.",
  },
  {
    value: "alternate-sat-sun",
    label: "Alternate Saturday + Sunday off",
    hint: "Every Sunday is off. 1st, 3rd and 5th Saturdays are off; 2nd and 4th Saturdays are working.",
  },
];

export function normalizeWeekendOff(value: unknown): WeekendOffPattern {
  return value === "alternate-sat-sun" ? "alternate-sat-sun" : "sunday-only";
}

export function weekendOffLabel(pattern: WeekendOffPattern): string {
  return WEEKEND_OFF_OPTIONS.find((o) => o.value === pattern)?.label ?? "Only Sunday off";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** 1-based Saturday of that calendar month (1 = first Saturday). */
function saturdayIndexInMonth(year: number, month: number, day: number): number {
  let index = 0;
  for (let d = 1; d <= day; d++) {
    if (new Date(year, month - 1, d).getDay() === 6) index++;
  }
  return index;
}

export function isOffDay(dateStr: string, pattern: WeekendOffPattern): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  if (dow === 0) return true;
  if (pattern === "sunday-only") return false;
  if (dow !== 6) return false;
  return saturdayIndexInMonth(year, month, day) % 2 === 1;
}

export function workingDaysInMonth(yearMonth: string, pattern: WeekendOffPattern): number {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return 0;
  const last = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= last; day++) {
    if (!isOffDay(isoDate(year, month, day), pattern)) count++;
  }
  return count;
}

function creditForWorkingDay(status: AttendanceStatus | undefined): number {
  if (!status || status === "not-marked" || status === "weekend" || status === "holiday") return 1;
  if (status === "absent") return 0;
  if (status === "half-day") return 0.5;
  return 1;
}

export function calculateMonthSalary(input: {
  monthlySalary: number;
  yearMonth: string;
  pattern: WeekendOffPattern;
  attendance: Pick<AttendanceRecord, "date" | "status">[];
}) {
  const workingDays = workingDaysInMonth(input.yearMonth, input.pattern);
  const byDate = new Map(input.attendance.map((row) => [row.date, row.status]));
  const [year, month] = input.yearMonth.split("-").map(Number);
  const last = year && month ? new Date(year, month, 0).getDate() : 0;

  let creditedDays = 0;
  for (let day = 1; day <= last; day++) {
    const date = isoDate(year, month, day);
    if (isOffDay(date, input.pattern)) continue;
    creditedDays += creditForWorkingDay(byDate.get(date));
  }

  const lopDays = Math.max(0, Math.round((workingDays - creditedDays) * 2) / 2);
  const perDay = workingDays ? input.monthlySalary / workingDays : 0;
  const attendancePay = Math.max(0, Math.round(perDay * creditedDays));

  return { workingDays, creditedDays, lopDays, perDay, attendancePay };
}
