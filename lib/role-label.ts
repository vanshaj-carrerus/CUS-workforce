import type { Role } from "./types";

export const roleLabel: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  "hr-admin": "HR Administrator",
};

export function isHrPortalUser(user: { role: Role; department?: string; designation?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "hr-admin" || user.role === "manager") return true;
  const hay = `${user.department ?? ""} ${user.designation ?? ""}`.toLowerCase();
  return hay.includes("human resource") || hay.includes("hr admin") || hay.includes("hrbp") || /\bhr\b/.test(hay);
}
