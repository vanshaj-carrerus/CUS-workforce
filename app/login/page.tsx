"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Lock, Mail, ArrowRight, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import type { Employee, Role } from "@/lib/types";

const roleDescriptions: Record<Role, string> = {
  employee: "Standard employee access",
  manager: "Team & approvals access",
  "hr-admin": "Full HR administrator access",
};

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [email, setEmail] = useState("aditi.sharma@custech.co");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    apiGet<Employee[]>("/api/employees").then(setEmployees).catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNeedsSetup(false);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      router.replace("/dashboard");
      return;
    }
    if (result.error === "password-not-set") {
      setNeedsSetup(true);
    } else if (result.error === "invalid-password") {
      showToast("Incorrect password. Please try again.", "warning");
    } else if (result.error === "account-suspended") {
      showToast("This account has been suspended. Contact your HR administrator.", "warning");
    } else if (result.error === "not-found") {
      showToast("We couldn't find an account with that email or employee ID.", "warning");
    } else {
      showToast("Something went wrong. Please try again.", "warning");
    }
  }

  async function handleResendSetup() {
    setResending(true);
    try {
      const res = await apiPost<{ sent: boolean }>("/api/auth/resend-setup", { email: email.trim() });
      showToast(res.sent ? "Setup link re-sent — check your inbox." : "Couldn't send the email right now.", res.sent ? "success" : "warning");
    } catch {
      showToast("Couldn't send the email right now.", "warning");
    } finally {
      setResending(false);
    }
  }

  function pickDemo(emp: Employee) {
    setSelectedEmail(emp.email);
    setEmail(emp.email);
    setPassword("demo1234");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-bold backdrop-blur">
              CT
            </div>
            <span className="text-sm font-semibold">Custech</span>
          </div>
        </div>
        <div className="relative max-w-sm">
          <ShieldCheck className="mb-6 h-10 w-10 text-white/80" />
          <h2 className="text-3xl font-semibold leading-tight">Everything HR, in one secure place.</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Attendance, leave, payroll, performance and more — manage your entire employee journey at Custech from a single dashboard.
          </p>
        </div>
        <p className="relative text-xs text-white/60">© 2026 Custech Technologies Pvt. Ltd. All rights reserved.</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="lg:hidden mb-6">
              <Logo />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Employee HR Portal</h1>
            <p className="mt-1.5 text-sm text-muted">Sign in with your work credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Employee ID or Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNeedsSetup(false);
                  }}
                  placeholder="you@custech.co"
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-brand hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand accent-[#4338ca] focus:ring-brand"
                />
                Remember me
              </label>
            </div>

            {needsSetup && (
              <div className="rounded-xl border border-warning-bg bg-warning-bg/60 px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-warning">
                  <MailCheck className="h-4 w-4" /> You haven&apos;t set a password yet
                </p>
                <p className="mt-1 text-muted">Check your email for the setup link, or resend it below.</p>
                <button
                  type="button"
                  onClick={handleResendSetup}
                  disabled={resending}
                  className="mt-2 font-medium text-brand hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend setup link"}
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" loading={submitting} size="lg">
              {!submitting && (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
              {submitting && "Signing in..."}
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted lg:text-left">
              Quick demo access
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {employees.map((emp) => (
                <button
                  key={emp.email}
                  type="button"
                  onClick={() => pickDemo(emp)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                    selectedEmail === emp.email
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-border bg-surface text-muted hover:border-brand/40 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-foreground">{emp.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{roleDescriptions[emp.role]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
