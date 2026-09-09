export type Role = "employee" | "manager" | "hr-admin";

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  designation: string;
  department: string;
  location: string;
  joiningDate: string;
  reportingManager: string;
  avatarColor: string;
  initials: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  address: string;
  dateOfBirth: string;
}

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "wfh"
  | "holiday"
  | "leave"
  | "weekend"
  | "half-day"
  | "full-day"
  | "not-marked";

export interface AttendanceRecord {
  employeeId?: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: string | null;
  status: AttendanceStatus;
}

export type TeamAttendanceStatus = "full-day" | "half-day" | "leave" | "absent";

export interface TeamAttendanceRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  status: TeamAttendanceStatus;
}

export type RequestStatus = "pending" | "in-progress" | "resolved" | "approved" | "rejected";

export interface LeaveBalance {
  employeeId: string;
  type: string;
  total: number;
  used: number;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: RequestStatus;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  category: string;
  postedBy: string;
}

export interface PolicyDocument {
  id: string;
  name: string;
  category: string;
  lastUpdated: string;
  fileType: "PDF" | "DOCX" | "XLSX";
  size: string;
  fileUrl?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  createdDate: string;
  assignedTo: string;
  status: RequestStatus;
  raisedBy: string;
  raisedById?: string;
  source?: "form" | "chat";
  messages: {
    id: string;
    author: string;
    role: "employee" | "hr";
    message: string;
    date: string;
  }[];
}

export interface Payslip {
  id: string;
  month: string;
  payDate: string;
  netSalary: number;
  status: "Paid" | "Processing";
}

export type WeekendOffPattern = "sunday-only" | "alternate-sat-sun";

export interface EmployeeRecord {
  id: string;
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  address: string;
  designation: string;
  department: string;
  joiningDate: string;
  salary: number;
  /** Weekly offs used to count working days and calculate monthly pay. */
  weekendOff: WeekendOffPattern;
  status: "Active" | "Inactive";
  addedOn: string;
  gender?: "Male" | "Female";
  /** Portal role once this record logs in. Defaults to "employee" when unset. */
  role?: Role;
  passwordHash?: string;
  passwordSet: boolean;
  setupToken?: string | null;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  type: "add" | "cut";
  amount: number;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  type: "leave" | "payroll" | "announcement" | "training" | "ticket" | "performance" | "attendance";
  /** When set, only this employee sees the notification. Global notices omit it. */
  employeeId?: string;
  href?: string;
}
