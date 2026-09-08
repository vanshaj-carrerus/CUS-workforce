import type { Employee, EmployeeRecord } from "./types";
import { initialsFromName } from "./utils";

/** Adapts a self-onboarded / HR-added EmployeeRecord into the shape the portal uses for a logged-in user. */
export function employeeRecordToEmployee(record: EmployeeRecord): Employee {
  return {
    id: record.id,
    employeeId: record.id,
    name: record.fullName,
    email: record.email,
    phone: record.mobile,
    role: record.role ?? "employee",
    designation: record.designation || "Not Assigned",
    department: record.department || "Not Assigned",
    location: record.address || "Not Provided",
    joiningDate: record.joiningDate || record.addedOn,
    reportingManager: "HR Team",
    avatarColor: "#4338CA",
    initials: initialsFromName(record.fullName),
    emergencyContact: {
      name: "Not Provided",
      relation: "Not Provided",
      phone: record.alternateMobile || "Not Provided",
    },
    address: record.address || "Not Provided",
    dateOfBirth: record.dateOfBirth || "Not Provided",
  };
}
