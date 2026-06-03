"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  POSITIONS,
  POSITION_LABEL,
} from "@/lib/validators/techniques";
import { cn } from "@/lib/utils";

export function LibraryFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentQ = search.get("q") ?? "";
  const currentPosition = search.get("position") ?? "";
  const currentCategory = search.get("category") ?? "";
  const currentSavedOnly = search.get("saved") === "1";

  const [q, setQ] = useState(currentQ);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if (q === currentQ) return;
      pushParams({ q: q || null });
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, description, or tag…"
            className="pl-9"
          />
        </div>

        <select
          value={currentPosition}
          onChange={(e) => pushParams({ position: e.target.value || null })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All positions</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {POSITION_LABEL[p]}
            </option>
          ))}
        </select>

        <select
          value={currentCategory}
          onChange={(e) => pushParams({ category: e.target.value || null })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => pushParams({ saved: currentSavedOnly ? null : "1" })}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
            currentSavedOnly
              ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "border-input bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", currentSavedOnly && "fill-current")} />
          Saved
        </button>
      </div>

      {pending ? <p className="text-xs text-muted-foreground">Updating…</p> : null}
    </div>
  );
}
