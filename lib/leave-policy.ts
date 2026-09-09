/** Default annual leave allotment by gender, applied when an employee record is created or their gender changes. */
export const ANNUAL_LEAVE_BY_GENDER: Record<"Male" | "Female", number> = {
  Female: 12,
  Male: 7,
};

export function annualLeaveForGender(gender: unknown): number | null {
  return gender === "Male" || gender === "Female" ? ANNUAL_LEAVE_BY_GENDER[gender] : null;
}
