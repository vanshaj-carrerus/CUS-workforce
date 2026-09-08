"use client";

import { useState } from "react";
import { Pencil, Mail, Phone, MapPin, Briefcase, Building2, CalendarDays, UserCheck, HeartPulse } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiPatch } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Field";
import { roleLabel } from "@/lib/role-label";
import { formatDate } from "@/lib/utils";
import type { Employee } from "@/lib/types";

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await apiPatch<Employee>("/api/profile", { role: user!.role, phone, address });
      updateUser({ phone, address });
      setEditOpen(false);
      showToast("Profile updated successfully.");
    } catch {
      showToast("Failed to update profile. Please try again.", "warning");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View and manage your personal information"
        action={
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted">{user.designation}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark">{user.employeeId}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{user.department}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{roleLabel[user.role]}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal Information" />
          <div className="divide-y divide-border">
            <InfoRow icon={UserCheck} label="Full Name" value={user.name} />
            <InfoRow icon={CalendarDays} label="Date of Birth" value={formatDate(user.dateOfBirth)} />
            <InfoRow icon={MapPin} label="Address" value={address} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Employment Information" />
          <div className="divide-y divide-border">
            <InfoRow icon={Briefcase} label="Employee ID" value={user.employeeId} />
            <InfoRow icon={Building2} label="Department" value={user.department} />
            <InfoRow icon={UserCheck} label="Designation" value={user.designation} />
            <InfoRow icon={CalendarDays} label="Joining Date" value={formatDate(user.joiningDate)} />
            <InfoRow icon={UserCheck} label="Reporting Manager" value={user.reportingManager} />
            <InfoRow icon={MapPin} label="Office Location" value={user.location} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Contact Information" />
          <div className="divide-y divide-border">
            <InfoRow icon={Mail} label="Work Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone Number" value={phone} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Emergency Contact" />
          <div className="divide-y divide-border">
            <InfoRow icon={UserCheck} label="Contact Name" value={user.emergencyContact.name} />
            <InfoRow icon={HeartPulse} label="Relation" value={user.emergencyContact.relation} />
            <InfoRow icon={Phone} label="Contact Phone" value={user.emergencyContact.phone} />
          </div>
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
