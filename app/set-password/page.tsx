"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { Logo } from "@/components/ui/Logo";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ValidationState = "checking" | "valid" | "invalid" | "already-set";

export default function SetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<ValidationState>("checking");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setState("invalid");
      return;
    }
    fetch(`/api/auth/set-password?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setState(data.error === "already-set" ? "already-set" : "invalid");
          return;
        }
        setFullName(data.fullName);
        setState("valid");
      })
      .catch(() => setState("invalid"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/auth/set-password", { token, password });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again or request a new link.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (state === "invalid" || state === "already-set") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {state === "already-set" ? "Password already set" : "This link isn't valid"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {state === "already-set"
              ? "You've already activated your account. Head to the login page to sign in."
              : "This setup link is invalid or has expired. Ask HR to resend your access email, or request a new link from the login page."}
          </p>
          <Link href="/login" className="mt-5 inline-block">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Password set successfully</h1>
          <p className="mt-2 text-sm text-muted">Your account is active. You can now sign in to the HR Portal.</p>
          <Link href="/login" className="mt-5 inline-block">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-5 text-2xl font-semibold text-foreground">Set your password</h1>
        <p className="mt-1.5 text-sm text-muted">Welcome, {fullName.split(" ")[0]}! Choose a password to activate your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div>
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="pl-10 pr-10"
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
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="pl-10"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" loading={submitting} size="lg">
          Set Password &amp; Activate Account
        </Button>
      </form>
    </div>
  );
}
