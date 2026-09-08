import {
  LayoutDashboard,
  User,
  CalendarCheck,
  CalendarRange,
  Wallet,
  Megaphone,
  FileText,
  LifeBuoy,
  BarChart3,
  UserPlus,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/profile", icon: User },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Leave Management", href: "/leave", icon: CalendarRange },
  { label: "Payroll", href: "/payroll", icon: Wallet },
  { label: "HR Announcements", href: "/announcements", icon: Megaphone },
  { label: "Policies & Documents", href: "/documents", icon: FileText },
  { label: "HR Helpdesk", href: "/helpdesk", icon: LifeBuoy },
  { label: "Employee Records", href: "/employees", icon: UserPlus, roles: ["hr-admin"] },
  { label: "HR Admin Analytics", href: "/admin", icon: BarChart3, roles: ["hr-admin"] },
];

export const bottomNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];
