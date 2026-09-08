import type { AttendanceRecord, AttendanceStatus, TeamAttendanceStatus } from "@/lib/types";

export function teamStatusToEmployeeRecord(
  employeeId: string,
  date: string,
  status: TeamAttendanceStatus
): AttendanceRecord {
  if (status === "full-day") {
    return {
      employeeId,
      date,
      checkIn: "09:00 AM",
      checkOut: "06:00 PM",
      hours: "9h 00m",
      status: "full-day",
    };
  }
  if (status === "half-day") {
    return {
      employeeId,
      date,
      checkIn: "09:00 AM",
      checkOut: "01:30 PM",
      hours: "4h 30m",
      status: "half-day",
    };
  }
  return {
    employeeId,
    date,
    checkIn: null,
    checkOut: null,
    hours: null,
    status: status === "leave" ? "leave" : "absent",
  };
}

/** How much of a working day this status counts toward attendance. Null = ignore. */
export function attendanceDayCredit(status: AttendanceStatus): number | null {
  if (status === "weekend" || status === "holiday" || status === "not-marked") return null;
  if (status === "absent") return 0;
  if (status === "half-day") return 0.5;
  return 1;
}

export function monthlyAttendancePercent(records: AttendanceRecord[], yearMonth: string): number {
  let expected = 0;
  let earned = 0;
  for (const row of records) {
    if (!row.date.startsWith(yearMonth)) continue;
    const credit = attendanceDayCredit(row.status);
    if (credit === null) continue;
    expected += 1;
    earned += credit;
  }
  if (!expected) return 0;
  return Math.round((earned / expected) * 100);
}
