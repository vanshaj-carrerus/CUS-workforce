import type { Employee } from "./types";

/** Emails allowed into the owner-only Admin Panel, regardless of their portal role. */
const SUPER_ADMIN_EMAILS = ["yash@custech.co"];

export function isSuperAdmin(user: Pick<Employee, "email"> | null | undefined): boolean {
  if (!user?.email) return false;
  return SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
}
