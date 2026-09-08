"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, FileText, Eye, Download, FolderOpen, Trash2, Plus, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPostForm, apiDelete } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select, Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Th, Tr, Td, TableWrap } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import type { PolicyDocument } from "@/lib/types";

const addCategories = [
  "Employee Handbook",
  "Leave Policy",
  "Work From Home Policy",
  "Code of Conduct",
  "IT Policy",
  "HR Forms",
  "Company Documents",
];

const categories = ["All", ...addCategories];

const fileTypeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  DOCX: "bg-blue-50 text-blue-600",
  XLSX: "bg-green-50 text-green-600",
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHr = user?.role === "hr-admin";
  const [loading, setLoading] = useState(true);
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [fileType, setFileType] = useState("All");
  const [deleteDoc, setDeleteDoc] = useState<PolicyDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PolicyDocument[]>("/api/documents")
      .then(setPolicyDocuments)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const newDoc = await apiPostForm<PolicyDocument>("/api/documents", form);
      setPolicyDocuments((prev) => [newDoc, ...prev]);
      setAddOpen(false);
      setSelectedFileName(null);
      showToast("Document added successfully.");
    } catch {
      showToast("Failed to add document. Please try again.", "warning");
    } finally {
      setSubmitting(false);
    }
  }

  function handleView(doc: PolicyDocument) {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      showToast("No file was uploaded for this document.", "warning");
    }
  }

  function handleDownload(doc: PolicyDocument) {
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showToast("No file was uploaded for this document.", "warning");
    }
  }

  async function handleDelete() {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/documents/${deleteDoc.id}`);
      setPolicyDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
      showToast(`${deleteDoc.name} deleted.`);
    } catch {
      showToast("Failed to delete document. Please try again.", "warning");
    } finally {
      setDeleting(false);
      setDeleteDoc(null);
    }
  }

  const filtered = useMemo(() => {
    return policyDocuments.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (fileType !== "All" && d.fileType !== fileType) return false;
      if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [policyDocuments, query, category, fileType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies & Documents"
        subtitle="Centralized library of HR policies, forms, and company documents"
        action={
          isHr && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          )
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-52">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={fileType} onChange={(e) => setFileType(e.target.value)} className="sm:w-36">
            <option>All</option>
            <option>PDF</option>
            <option>DOCX</option>
            <option>XLSX</option>
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader title="Documents" subtitle={`${filtered.length} document${filtered.length !== 1 ? "s" : ""} found`} />
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No documents found" description="Try adjusting your search or filters." />
        ) : (
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <Th>Document Name</Th>
                  <Th>Category</Th>
                  <Th>Last Updated</Th>
                  <Th>File Type</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {filtered.map((d) => (
                  <Tr key={d.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-muted" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{d.name}</p>
                          <p className="text-xs text-muted">{d.size}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{d.category}</Td>
                    <Td>{formatDate(d.lastUpdated)}</Td>
                    <Td>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${fileTypeColors[d.fileType]}`}>{d.fileType}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => handleView(d)} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button onClick={() => handleDownload(d)} className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                        {isHr && (
                          <button onClick={() => setDeleteDoc(d)} className="flex items-center gap-1 text-sm font-medium text-danger hover:underline">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteDoc?.name}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSelectedFileName(null);
        }}
        title="Add Document"
      >
        <form className="space-y-4" onSubmit={handleAdd}>
          <div>
            <Label htmlFor="doc-name">Document Name</Label>
            <Input id="doc-name" name="name" required placeholder="e.g. Travel Reimbursement Policy" />
          </div>
          <div>
            <Label htmlFor="doc-category">Category</Label>
            <Select id="doc-category" name="category" required defaultValue={addCategories[0]}>
              {addCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-fileType">File Type</Label>
            <Select id="doc-fileType" name="fileType" required defaultValue="PDF">
              <option>PDF</option>
              <option>DOCX</option>
              <option>XLSX</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-file">File</Label>
            <label
              htmlFor="doc-file"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-6 text-center text-sm text-muted hover:border-brand/40"
            >
              <Upload className="h-4 w-4 shrink-0" />
              {selectedFileName ?? "Click to upload a file"}
              <input
                id="doc-file"
                name="file"
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddOpen(false);
                setSelectedFileName(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
