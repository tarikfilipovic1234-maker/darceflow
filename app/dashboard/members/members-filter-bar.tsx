"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLES = ["ADMIN", "COACH", "STUDENT"] as const;
const BELTS = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"] as const;

const TABS = [
  { value: "", label: "All" },
  { value: "ADMIN", label: "Admins" },
  { value: "COACH", label: "Coaches" },
  { value: "STUDENT", label: "Students" },
] as const;

export function MembersFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentQ = search.get("q") ?? "";
  const currentRole = search.get("role") ?? "";
  const currentBelt = search.get("belt") ?? "";

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
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-1">
        {TABS.map((tab) => {
          const active = tab.value === currentRole;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              onClick={() => pushParams({ role: tab.value || null })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 px-1.5 py-0.5">
          {currentBelt ? (
            <button
              type="button"
              onClick={() => pushParams({ belt: null })}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs"
            >
              Belt: {currentBelt}
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>

        <select
          value={currentBelt}
          onChange={(e) => pushParams({ belt: e.target.value || null })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All belts</option>
          {BELTS.map((b) => (
            <option key={b} value={b}>
              {b.charAt(0) + b.slice(1).toLowerCase()} belt
            </option>
          ))}
        </select>
      </div>

      {pending ? (
        <p className="text-xs text-muted-foreground">Updating…</p>
      ) : null}
      {/* Roles list kept here so tree-shakers don't drop the enum (used in URL). */}
      <span className="sr-only" aria-hidden>
        {ROLES.join(",")}
      </span>
    </div>
  );
}
