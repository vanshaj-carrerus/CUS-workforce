"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, User, Megaphone, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/StatusBadge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select, Textarea, Label } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { cn, formatDate } from "@/lib/utils";
import type { Announcement } from "@/lib/types";

const postCategories = ["Company News", "Holidays", "HR Policies", "Events", "Important Notices", "Employee Activities"];
const filterCategories = ["All", ...postCategories];

function AnnouncementForm({
  defaultValues,
  submitting,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  defaultValues?: Announcement;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <Label htmlFor="an-title">Title</Label>
        <Input id="an-title" name="title" required placeholder="e.g. Office closed for Diwali" defaultValue={defaultValues?.title} />
      </div>
      <div>
        <Label htmlFor="an-category">Category</Label>
        <Select id="an-category" name="category" required defaultValue={defaultValues?.category ?? postCategories[0]}>
          {postCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="an-description">Short Description</Label>
        <Textarea
          id="an-description"
          name="description"
          rows={2}
          placeholder="One or two lines shown on the announcement card"
          defaultValue={defaultValues?.description}
        />
      </div>
      <div>
        <Label htmlFor="an-content">Full Content</Label>
        <Textarea
          id="an-content"
          name="content"
          rows={5}
          required
          placeholder="The full announcement text employees will see when they click Read More..."
          defaultValue={defaultValues?.content}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHr = user?.role === "hr-admin";
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiGet<Announcement[]>("/api/announcements")
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const matchesCategory = category === "All" || a.category === category;
      const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase()) || a.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [announcements, query, category]);

  function formToPayload(form: FormData) {
    return {
      title: form.get("title"),
      category: form.get("category"),
      description: form.get("description"),
      content: form.get("content"),
    };
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formToPayload(new FormData(e.currentTarget)), postedBy: user?.name };
      const newAnnouncement = await apiPost<Announcement>("/api/announcements", payload);
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setAddOpen(false);
      showToast("Announcement published to all employees.");
    } catch {
      showToast("Failed to publish announcement. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editAnnouncement) return;
    setSubmitting(true);
    try {
      const updated = await apiPatch<Announcement>(
        `/api/announcements/${editAnnouncement.id}`,
        formToPayload(new FormData(e.currentTarget))
      );
      setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditAnnouncement(null);
      showToast("Announcement updated.");
    } catch {
      showToast("Failed to update announcement. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteAnnouncement) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/announcements/${deleteAnnouncement.id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteAnnouncement.id));
      showToast("Announcement deleted.");
    } catch {
      showToast("Failed to delete announcement. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteAnnouncement(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <PageHeader
          title="HR Announcements"
          subtitle="Stay updated with the latest company news and notices"
          action={
            isHr && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> New Announcement
              </Button>
            )
          }
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  category === c ? "border-brand bg-brand text-white" : "border-border bg-surface text-muted hover:border-brand/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements available." description="Try a different search term or category." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <CategoryBadge label={a.category} />
                <span className="text-xs text-muted">{formatDate(a.date)}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">{a.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <User className="h-3.5 w-3.5" /> {a.postedBy}
                </span>
                <div className="flex items-center gap-3">
                  {isHr && (
                    <>
                      <button
                        onClick={() => setEditAnnouncement(a)}
                        className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteAnnouncement(a)}
                        className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelected(a)} className="text-sm font-medium text-brand hover:underline">
                    Read More
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <CategoryBadge label={selected.category} />
              <span>{formatDate(selected.date)}</span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {selected.postedBy}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{selected.content}</p>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Announcement">
        <AnnouncementForm submitting={submitting} submitLabel="Publish" onCancel={() => setAddOpen(false)} onSubmit={handleAdd} />
      </Modal>

      <Modal open={!!editAnnouncement} onClose={() => setEditAnnouncement(null)} title="Edit Announcement">
        {editAnnouncement && (
          <AnnouncementForm
            defaultValues={editAnnouncement}
            submitting={submitting}
            submitLabel="Save Changes"
            onCancel={() => setEditAnnouncement(null)}
            onSubmit={handleEdit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteAnnouncement}
        onClose={() => setDeleteAnnouncement(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${deleteAnnouncement?.title}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />
    </div>
  );
}
