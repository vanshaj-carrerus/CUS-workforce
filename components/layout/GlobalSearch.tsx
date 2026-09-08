"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { SearchResult } from "@/lib/search-index";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiGet<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search policies, documents, requests..."
          className="w-full rounded-xl border border-border bg-slate-50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/15"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg shadow-slate-900/5 animate-fade-in">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <ul className="py-1.5">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    onMouseDown={() => {
                      router.push(r.href);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <span className="flex-1 truncate text-foreground">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted">{r.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
