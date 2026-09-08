"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { roleLabel } from "@/lib/role-label";

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-slate-200"}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      <Card>
        <CardHeader title="Account" subtitle="Your account and access details" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-name">Full Name</Label>
            <Input id="s-name" defaultValue={user.name} disabled />
          </div>
          <div>
            <Label htmlFor="s-email">Work Email</Label>
            <Input id="s-email" defaultValue={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="s-role">Access Role</Label>
            <Input id="s-role" defaultValue={roleLabel[user.role]} disabled />
          </div>
          <div>
            <Label htmlFor="s-lang">Language</Label>
            <Select id="s-lang" defaultValue="en">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Notification Preferences" subtitle="Choose how you'd like to be notified" />
        <div className="divide-y divide-border">
          <Toggle checked={emailNotif} onChange={setEmailNotif} label="Email Notifications" description="Leave approvals, payslips, and HR updates" />
          <Toggle checked={pushNotif} onChange={setPushNotif} label="Push Notifications" description="Real-time alerts for ticket updates" />
          <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} label="Weekly Digest" description="A summary of announcements and requests every Monday" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Security" subtitle="Update your password" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="current-pw">Current Password</Label>
            <Input id="current-pw" type="password" placeholder="••••••••" />
          </div>
          <div />
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <Input id="new-pw" type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input id="confirm-pw" type="password" placeholder="••••••••" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => showToast("Password updated successfully.")}>
            <Lock className="h-4 w-4" /> Update Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
