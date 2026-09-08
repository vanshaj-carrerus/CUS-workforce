import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/mongo-helpers";
import { teamStatusToEmployeeRecord } from "@/lib/attendance-map";
import { calculateMonthSalary, normalizeWeekendOff } from "@/lib/weekend-off";
import type { AttendanceRecord, EmployeeRecord, TeamAttendanceRecord } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const employeeId = url.searchParams.get("employeeId");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse(new Error("Invalid month"), 400);
    }

    const db = await getDb();
    const recordFilter = employeeId ? { id: employeeId } : {};
    const employees = (await db
      .collection<EmployeeRecord>("employeeRecords")
      .find(recordFilter, { projection: { _id: 0, passwordHash: 0, setupToken: 0 } })
      .toArray()) as EmployeeRecord[];

    const monthStart = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const monthEnd = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
    const dateRange = { $gte: monthStart, $lte: monthEnd };
    const attendanceFilter = employeeId ? { employeeId, date: dateRange } : { date: dateRange };

    const [personal, team] = await Promise.all([
      db.collection("employeeAttendance").find(attendanceFilter, { projection: { _id: 0 } }).toArray(),
      db.collection("teamAttendance").find(attendanceFilter, { projection: { _id: 0 } }).toArray(),
    ]);

    const byEmployee = new Map<string, Map<string, AttendanceRecord>>();
    function setRow(id: string, row: AttendanceRecord) {
      if (!byEmployee.has(id)) byEmployee.set(id, new Map());
      byEmployee.get(id)!.set(row.date, row);
    }

    for (const row of personal as unknown as AttendanceRecord[]) {
      if (row.employeeId && row.date) setRow(row.employeeId, row);
    }
    for (const row of team as unknown as TeamAttendanceRecord[]) {
      if (row.employeeId && row.date && row.status) {
        setRow(row.employeeId, teamStatusToEmployeeRecord(row.employeeId, row.date, row.status));
      }
    }

    const rows = employees.map((emp) => {
      const pattern = normalizeWeekendOff(emp.weekendOff);
      const calc = calculateMonthSalary({
        monthlySalary: emp.salary,
        yearMonth: month,
        pattern,
        attendance: [...(byEmployee.get(emp.id)?.values() ?? [])],
      });
      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        salary: emp.salary,
        weekendOff: pattern,
        ...calc,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}
