"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { Logo } from "@/components/ui/Logo";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { EmployeeRecord } from "@/lib/types";

export default function OnboardPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<(EmployeeRecord & { emailSent?: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const record = await apiPost<EmployeeRecord & { emailSent?: boolean }>("/api/employee-records", {
        fullName: form.get("fullName"),
        fatherName: form.get("fatherName"),
        dateOfBirth: form.get("dateOfBirth"),
        mobile: form.get("mobile"),
        alternateMobile: form.get("alternateMobile"),
        email: form.get("email"),
        address: form.get("address"),
        designation: form.get("designation"),
        department: form.get("department"),
      });
      setSubmitted(record);
    } catch {
      setError("Something went wrong while submitting your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Details submitted successfully</h1>
          <p className="mt-2 text-sm text-muted">
            Thanks, {submitted.fullName.split(" ")[0]}! Your reference ID is <span className="font-medium text-foreground">{submitted.id}</span>.
            The HR team will review your details and reach out to you shortly.
          </p>
          {submitted.emailSent && (
            <p className="mt-3 text-sm text-success">
              We&apos;ve emailed a link to {submitted.email} — set your password there to activate portal access.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-5 text-2xl font-semibold text-foreground">Employee Onboarding Form</h1>
          <p className="mt-1.5 text-sm text-muted">
            Fill in your details below. Our HR team will review and set up your employee profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" required placeholder="e.g. Ananya Gupta" />
          </div>
          <div>
            <Label htmlFor="fatherName">Father&apos;s Name</Label>
            <Input id="fatherName" name="fatherName" placeholder="e.g. Rakesh Gupta" />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" name="mobile" type="tel" required placeholder="+91 90000 00000" />
            </div>
            <div>
              <Label htmlFor="alternateMobile">Alternative Mobile Number</Label>
              <Input id="alternateMobile" name="alternateMobile" type="tel" placeholder="+91 90000 00000" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email ID</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="designation">Designation Applied For</Label>
              <Input id="designation" name="designation" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <Label htmlFor="department">Preferred Department</Label>
              <Input id="department" name="department" placeholder="e.g. Engineering" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} placeholder="Full residential address" />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" className="w-full" loading={submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Details"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">© 2026 Custech Technologies Pvt. Ltd.</p>
      </div>
    </div>
  );
}
