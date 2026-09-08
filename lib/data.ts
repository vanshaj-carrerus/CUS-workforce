import type {
  Employee,
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  Announcement,
  PolicyDocument,
  Ticket,
  Payslip,
  NotificationItem,
  Role,
} from "./types";

export const employees: Record<Role, Employee> = {
  employee: {
    id: "emp-1",
    employeeId: "CT-2041",
    name: "Aditi Sharma",
    email: "aditi.sharma@custech.co",
    phone: "+91 98765 43210",
    role: "employee",
    designation: "Senior Software Engineer",
    department: "Engineering",
    location: "Bengaluru, India",
    joiningDate: "2022-03-14",
    reportingManager: "Rohan Verma",
    avatarColor: "#4F46E5",
    initials: "AS",
    emergencyContact: { name: "Kavita Sharma", relation: "Mother", phone: "+91 98111 22334" },
    address: "402, Palm Residency, Koramangala, Bengaluru",
    dateOfBirth: "1996-07-22",
  },
  manager: {
    id: "emp-2",
    employeeId: "CT-1027",
    name: "Rohan Verma",
    email: "rohan.verma@custech.co",
    phone: "+91 98450 11223",
    role: "manager",
    designation: "Engineering Manager",
    department: "Engineering",
    location: "Bengaluru, India",
    joiningDate: "2019-06-01",
    reportingManager: "Neha Kapoor",
    avatarColor: "#0EA5A4",
    initials: "RV",
    emergencyContact: { name: "Simran Verma", relation: "Spouse", phone: "+91 99001 88776" },
    address: "12B, Whitefield Greens, Bengaluru",
    dateOfBirth: "1990-01-11",
  },
  "hr-admin": {
    id: "emp-3",
    employeeId: "CT-0512",
    name: "Neha Kapoor",
    email: "neha.kapoor@custech.co",
    phone: "+91 98220 55667",
    role: "hr-admin",
    designation: "HR Business Partner",
    department: "Human Resources",
    location: "Gurugram, India",
    joiningDate: "2017-11-20",
    reportingManager: "Founder's Office",
    avatarColor: "#E11D48",
    initials: "NK",
    emergencyContact: { name: "Arjun Kapoor", relation: "Spouse", phone: "+91 98991 44556" },
    address: "Sector 45, DLF Phase 3, Gurugram",
    dateOfBirth: "1988-04-05",
  },
};

export const leaveBalances: LeaveBalance[] = [
  { type: "Annual Leave", total: 0, used: 0 },
  { type: "Sick Leave", total: 0, used: 0 },
  { type: "Casual Leave", total: 0, used: 0 },
];

export const leaveHistory: LeaveRequest[] = [
  {
    id: "LR-2041",
    employeeName: "Aditi Sharma",
    employeeId: "CT-2041",
    type: "Annual Leave",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    days: 0,
    reason: "Family function out of town",
    appliedOn: "2026-08-28",
    status: "pending",
  },
  {
    id: "LR-2038",
    employeeName: "Aditi Sharma",
    employeeId: "CT-2041",
    type: "Sick Leave",
    startDate: "2026-08-04",
    endDate: "2026-08-04",
    days: 0,
    reason: "Fever and viral infection",
    appliedOn: "2026-08-04",
    status: "approved",
  },
  {
    id: "LR-2019",
    employeeName: "Aditi Sharma",
    employeeId: "CT-2041",
    type: "Casual Leave",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    days: 0,
    reason: "Personal work",
    appliedOn: "2026-07-10",
    status: "approved",
  },
  {
    id: "LR-1988",
    employeeName: "Aditi Sharma",
    employeeId: "CT-2041",
    type: "Annual Leave",
    startDate: "2026-06-02",
    endDate: "2026-06-06",
    days: 0,
    reason: "Vacation",
    appliedOn: "2026-05-20",
    status: "rejected",
  },
];

export const teamLeaveApprovals: LeaveRequest[] = [
  {
    id: "LR-3102",
    employeeName: "Ishaan Mehta",
    employeeId: "CT-2077",
    type: "Annual Leave",
    startDate: "2026-09-15",
    endDate: "2026-09-18",
    days: 0,
    reason: "Travelling home for a wedding",
    appliedOn: "2026-09-01",
    status: "pending",
  },
  {
    id: "LR-3098",
    employeeName: "Priya Nair",
    employeeId: "CT-2083",
    type: "Sick Leave",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    days: 0,
    reason: "Not feeling well",
    appliedOn: "2026-09-04",
    status: "pending",
  },
  {
    id: "LR-3050",
    employeeName: "Karan Malhotra",
    employeeId: "CT-1994",
    type: "Casual Leave",
    startDate: "2026-08-29",
    endDate: "2026-08-29",
    days: 0,
    reason: "Bank work",
    appliedOn: "2026-08-27",
    status: "pending",
  },
];

function buildAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceRecord["status"][] = [
    "present",
    "present",
    "present",
    "present",
    "wfh",
    "present",
    "late",
    "present",
    "present",
    "leave",
    "present",
    "present",
    "wfh",
    "present",
    "absent",
    "present",
    "present",
    "present",
    "wfh",
    "present",
    "present",
    "late",
    "present",
    "present",
  ];
  let statusIdx = 0;
  for (let day = 1; day <= 30; day++) {
    const date = `2026-08-${String(day).padStart(2, "0")}`;
    const dow = new Date(2026, 7, day).getDay();
    if (dow === 0 || dow === 6) {
      records.push({ date, checkIn: null, checkOut: null, hours: null, status: "weekend" });
      continue;
    }
    if (day === 15) {
      records.push({ date, checkIn: null, checkOut: null, hours: null, status: "holiday" });
      continue;
    }
    const status = statuses[statusIdx % statuses.length];
    statusIdx++;
    if (status === "absent") {
      records.push({ date, checkIn: null, checkOut: null, hours: null, status });
    } else if (status === "leave") {
      records.push({ date, checkIn: null, checkOut: null, hours: null, status });
    } else if (status === "late") {
      records.push({ date, checkIn: "10:42 AM", checkOut: "07:15 PM", hours: "8h 33m", status });
    } else if (status === "wfh") {
      records.push({ date, checkIn: "09:20 AM", checkOut: "06:45 PM", hours: "9h 25m", status });
    } else {
      records.push({ date, checkIn: "09:12 AM", checkOut: "06:38 PM", hours: "9h 26m", status });
    }
  }
  return records;
}

export const attendanceHistory: AttendanceRecord[] = buildAttendance();

export const upcomingHolidays = [
  { name: "Ganesh Chaturthi", date: "2026-09-14", day: "Monday" },
  { name: "Gandhi Jayanti", date: "2026-10-02", day: "Friday" },
  { name: "Diwali", date: "2026-11-08", day: "Sunday" },
  { name: "Christmas", date: "2026-12-25", day: "Friday" },
];

export const announcements: Announcement[] = [
  {
    id: "AN-401",
    title: "Custech named a Great Place to Work 2026",
    description: "We're proud to share that Custech has been certified as a Great Place to Work for the third year running.",
    content:
      "We're proud to share that Custech has been certified as a Great Place to Work for the third year running. This recognition reflects the trust, pride, and camaraderie our employees experience every day. Thank you to everyone who made this possible — celebrations will be held at all office locations this Friday.",
    date: "2026-09-02",
    category: "Company News",
    postedBy: "Neha Kapoor, HRBP",
  },
  {
    id: "AN-398",
    title: "Office closed for Ganesh Chaturthi",
    description: "All Custech offices will remain closed on September 14th in observance of Ganesh Chaturthi.",
    content:
      "All Custech offices will remain closed on September 14th, 2026 in observance of Ganesh Chaturthi. Employees on support rotations should check with their reporting manager for coverage plans.",
    date: "2026-08-30",
    category: "Holidays",
    postedBy: "HR Team",
  },
  {
    id: "AN-395",
    title: "Updated Work From Home Policy effective October 1",
    description: "A refreshed WFH policy introduces flexible hybrid schedules and revised equipment reimbursement.",
    content:
      "A refreshed Work From Home policy comes into effect on October 1st, 2026, introducing flexible hybrid schedules (up to 3 WFH days per week) and revised equipment reimbursement limits. Please review the updated document in Policies & Documents.",
    date: "2026-08-27",
    category: "HR Policies",
    postedBy: "Neha Kapoor, HRBP",
  },
  {
    id: "AN-390",
    title: "Annual Sports Day — Register your teams",
    description: "Get your teams ready! Annual Sports Day returns this year with cricket, badminton, and relay races.",
    content:
      "Get your teams ready! The Annual Sports Day returns this year on September 27th with cricket, badminton, table tennis, and relay races. Register your department teams with the Employee Engagement committee by September 18th.",
    date: "2026-08-22",
    category: "Events",
    postedBy: "Employee Engagement Committee",
  },
  {
    id: "AN-384",
    title: "Payroll processing date moved up this month",
    description: "September salaries will be processed on the 28th instead of the usual last working day.",
    content:
      "Due to the upcoming holidays, September salaries will be credited on the 28th instead of the usual last working day of the month. Payslips will be available in the Payroll section the same evening.",
    date: "2026-08-18",
    category: "Important Notices",
    postedBy: "Payroll Team",
  },
  {
    id: "AN-379",
    title: "Congratulations to our Q2 Spotlight Award winners",
    description: "Celebrating outstanding contributions from the Engineering, Sales, and Customer Success teams.",
    content:
      "Celebrating outstanding contributions from the Engineering, Sales, and Customer Success teams for Q2 2026. Winners will be felicitated at the town hall on September 20th. Thank you for raising the bar!",
    date: "2026-08-10",
    category: "Employee Activities",
    postedBy: "Leadership Team",
  },
];

export const policyDocuments: PolicyDocument[] = [
  { id: "DOC-1", name: "Employee Handbook 2026", category: "Employee Handbook", lastUpdated: "2026-01-15", fileType: "PDF", size: "2.4 MB" },
  { id: "DOC-2", name: "Leave Policy — India", category: "Leave Policy", lastUpdated: "2026-06-01", fileType: "PDF", size: "540 KB" },
  { id: "DOC-3", name: "Work From Home Policy (Updated)", category: "Work From Home Policy", lastUpdated: "2026-08-27", fileType: "PDF", size: "610 KB" },
  { id: "DOC-4", name: "Code of Conduct", category: "Code of Conduct", lastUpdated: "2025-11-10", fileType: "PDF", size: "1.1 MB" },
  { id: "DOC-5", name: "IT Acceptable Use Policy", category: "IT Policy", lastUpdated: "2026-03-22", fileType: "PDF", size: "480 KB" },
  { id: "DOC-6", name: "Reimbursement Claim Form", category: "HR Forms", lastUpdated: "2026-02-05", fileType: "XLSX", size: "88 KB" },
  { id: "DOC-7", name: "Address Proof Declaration Form", category: "HR Forms", lastUpdated: "2025-09-18", fileType: "DOCX", size: "64 KB" },
  { id: "DOC-8", name: "Company Org Chart", category: "Company Documents", lastUpdated: "2026-07-01", fileType: "PDF", size: "1.8 MB" },
  { id: "DOC-9", name: "Insurance & Benefits Guide", category: "Company Documents", lastUpdated: "2026-04-12", fileType: "PDF", size: "2.0 MB" },
  { id: "DOC-10", name: "Exit Process Checklist", category: "HR Forms", lastUpdated: "2025-12-01", fileType: "PDF", size: "220 KB" },
];

export const tickets: Ticket[] = [
  {
    id: "HD-5521",
    subject: "Incorrect attendance marked on Aug 21",
    category: "Attendance Correction",
    description: "I was working from home on Aug 21 but it's marked absent in the system.",
    priority: "Medium",
    createdDate: "2026-08-22",
    assignedTo: "Priya Iyer",
    status: "in-progress",
    raisedBy: "Aditi Sharma",
    messages: [
      { id: "m1", author: "Aditi Sharma", role: "employee", message: "I was working from home on Aug 21 but it's marked absent in the system. Can this be corrected?", date: "2026-08-22 09:14 AM" },
      { id: "m2", author: "Priya Iyer", role: "hr", message: "Thanks for flagging this, Aditi. Could you share your WFH approval email for that date?", date: "2026-08-22 02:40 PM" },
      { id: "m3", author: "Aditi Sharma", role: "employee", message: "Sure, attached the approval screenshot.", date: "2026-08-22 03:02 PM" },
      { id: "m4", author: "Priya Iyer", role: "hr", message: "Received, verifying with your manager and will update shortly.", date: "2026-08-23 10:20 AM" },
    ],
  },
  {
    id: "HD-5498",
    subject: "Reimbursement not reflected in payslip",
    category: "Payroll Issue",
    description: "Internet reimbursement for July hasn't been added to my August payslip.",
    priority: "High",
    createdDate: "2026-08-10",
    assignedTo: "Payroll Team",
    status: "pending",
    raisedBy: "Aditi Sharma",
    messages: [
      { id: "m1", author: "Aditi Sharma", role: "employee", message: "Internet reimbursement for July hasn't been added to my August payslip. Could you check?", date: "2026-08-10 11:05 AM" },
    ],
  },
  {
    id: "HD-5310",
    subject: "Request for experience letter",
    category: "Document Request",
    description: "Need an experience letter for a visa application.",
    priority: "Low",
    createdDate: "2026-07-02",
    assignedTo: "Neha Kapoor",
    status: "resolved",
    raisedBy: "Aditi Sharma",
    messages: [
      { id: "m1", author: "Aditi Sharma", role: "employee", message: "Need an experience letter for a visa application, at your earliest convenience.", date: "2026-07-02 09:30 AM" },
      { id: "m2", author: "Neha Kapoor", role: "hr", message: "Hi Aditi, generated and sent to your registered email. Let us know if you need any edits.", date: "2026-07-04 04:15 PM" },
      { id: "m3", author: "Aditi Sharma", role: "employee", message: "Received, thank you!", date: "2026-07-04 04:40 PM" },
    ],
  },
];

export const payslips: Payslip[] = [
  { id: "PS-08-2026", month: "August 2026", payDate: "2026-08-31", netSalary: 0, status: "Paid" },
  { id: "PS-07-2026", month: "July 2026", payDate: "2026-07-31", netSalary: 0, status: "Paid" },
  { id: "PS-06-2026", month: "June 2026", payDate: "2026-06-30", netSalary: 0, status: "Paid" },
  { id: "PS-05-2026", month: "May 2026", payDate: "2026-05-31", netSalary: 0, status: "Paid" },
  { id: "PS-04-2026", month: "April 2026", payDate: "2026-04-30", netSalary: 0, status: "Paid" },
  { id: "PS-09-2026", month: "September 2026", payDate: "2026-09-28", netSalary: 0, status: "Processing" },
];

export const notifications: NotificationItem[] = [
  { id: "N-1", title: "Leave request approved", description: "Your sick leave for Aug 4 has been approved.", date: "2026-08-05", read: false, type: "leave" },
  { id: "N-2", title: "August payslip available", description: "Your payslip for August 2026 is ready to download.", date: "2026-08-31", read: false, type: "payroll", href: "/payroll" },
  { id: "N-3", title: "New HR announcement", description: "Custech named a Great Place to Work 2026.", date: "2026-09-02", read: false, type: "announcement" },
  { id: "N-4", title: "Training assigned", description: "You've been assigned 'Effective Communication for Engineers'.", date: "2026-09-01", read: true, type: "training" },
  { id: "N-5", title: "Ticket HD-5521 updated", description: "HR requested additional information on your attendance correction request.", date: "2026-08-23", read: true, type: "ticket" },
  { id: "N-6", title: "Performance review available", description: "Your H1 2026 performance review has been published.", date: "2026-07-10", read: true, type: "performance" },
];

export const myRequestsSummary = [
  { id: tickets[0].id, subject: tickets[0].subject, status: tickets[0].status },
  { id: tickets[1].id, subject: tickets[1].subject, status: tickets[1].status },
  { id: tickets[2].id, subject: tickets[2].subject, status: tickets[2].status },
];

// Admin analytics
export const headcountTrend = [
  { month: "Mar", headcount: 0 },
  { month: "Apr", headcount: 0 },
  { month: "May", headcount: 0 },
  { month: "Jun", headcount: 0 },
  { month: "Jul", headcount: 0 },
  { month: "Aug", headcount: 0 },
];

export const attendanceTrend = [
  { month: "Mar", rate: 0 },
  { month: "Apr", rate: 0 },
  { month: "May", rate: 0 },
  { month: "Jun", rate: 0 },
  { month: "Jul", rate: 0 },
  { month: "Aug", rate: 0 },
];

export const leaveTrend = [
  { month: "Mar", days: 0 },
  { month: "Apr", days: 0 },
  { month: "May", days: 0 },
  { month: "Jun", days: 0 },
  { month: "Jul", days: 0 },
  { month: "Aug", days: 0 },
];

export const departmentDistribution = [
  { name: "Engineering", value: 0 },
  { name: "Sales", value: 0 },
  { name: "Customer Success", value: 0 },
  { name: "Marketing", value: 0 },
  { name: "HR & Admin", value: 0 },
  { name: "Finance", value: 0 },
];

export const hiringAttrition = [
  { month: "Mar", hires: 0, attrition: 0 },
  { month: "Apr", hires: 0, attrition: 0 },
  { month: "May", hires: 0, attrition: 0 },
  { month: "Jun", hires: 0, attrition: 0 },
  { month: "Jul", hires: 0, attrition: 0 },
  { month: "Aug", hires: 0, attrition: 0 },
];

export const recentEmployees = [
  { id: "CT-3110", name: "Simran Bedi", designation: "Product Designer", department: "Design", joiningDate: "2026-08-25" },
  { id: "CT-3109", name: "Arjun Rao", designation: "SDE II", department: "Engineering", joiningDate: "2026-08-20" },
  { id: "CT-3105", name: "Fatima Sheikh", designation: "Customer Success Associate", department: "Customer Success", joiningDate: "2026-08-11" },
  { id: "CT-3098", name: "Vikram Singh", designation: "Sales Executive", department: "Sales", joiningDate: "2026-08-04" },
];

export const upcomingBirthdays = [
  { name: "Priya Nair", date: "2026-09-06", department: "Engineering" },
  { name: "Karan Malhotra", date: "2026-09-09", department: "Sales" },
  { name: "Fatima Sheikh", date: "2026-09-15", department: "Customer Success" },
];

export const upcomingAnniversaries = [
  { name: "Rohan Verma", date: "2026-09-01", years: 0 },
  { name: "Ishaan Mehta", date: "2026-09-12", years: 0 },
  { name: "Simran Bedi", date: "2026-09-25", years: 0 },
];

export const adminPendingApprovals = [
  { id: "LR-3102", type: "Leave Request", requester: "Ishaan Mehta", department: "Engineering", date: "2026-09-01" },
  { id: "HD-5498", type: "Payroll Issue", requester: "Aditi Sharma", department: "Engineering", date: "2026-08-10" },
  { id: "LR-3098", type: "Leave Request", requester: "Priya Nair", department: "Engineering", date: "2026-09-04" },
];

export const recentHrRequests = [
  { id: "HD-5521", subject: "Incorrect attendance marked on Aug 21", requester: "Aditi Sharma", status: "in-progress" as const, date: "2026-08-22" },
  { id: "HD-5498", subject: "Reimbursement not reflected in payslip", requester: "Aditi Sharma", status: "pending" as const, date: "2026-08-10" },
  { id: "HD-5450", subject: "Need help setting up VPN", requester: "Karan Malhotra", status: "resolved" as const, date: "2026-08-07" },
  { id: "HD-5442", subject: "Benefits enrollment query", requester: "Fatima Sheikh", status: "resolved" as const, date: "2026-08-05" },
];
