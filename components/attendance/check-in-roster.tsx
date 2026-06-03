"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import {
  checkInAction,
  undoCheckInAction,
} from "@/app/dashboard/check-in/actions";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BeltRank } from "@/lib/generated/prisma/enums";

type RosterMember = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  belt: BeltRank | null;
  stripes: number;
};

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function CheckInRoster({
  sessionId,
  members,
  initialCheckedIn,
}: {
  sessionId: string;
  members: RosterMember[];
  initialCheckedIn: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [optimistic, applyOptimistic] = useOptimistic(
    new Set(initialCheckedIn),
    (current, action: { userId: string; checked: boolean }) => {
      const next = new Set(current);
      if (action.checked) next.add(action.userId);
      else next.delete(action.userId);
      return next;
    },
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.name ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q),
    );
  }, [members, query]);

  function toggle(userId: string, currentlyChecked: boolean) {
    startTransition(async () => {
      applyOptimistic({ userId, checked: !currentlyChecked });
      const fd = new FormData();
      fd.set("sessionId", sessionId);
      fd.set("userId", userId);
      try {
        if (currentlyChecked) {
          await undoCheckInAction(fd);
        } else {
          await checkInAction(fd);
        }
      } catch {
        // Optimistic state will reconcile when the server response comes back
        // through the transition. No-op here.
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${members.length} members…`}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Roster</span>
          <span>
            {optimistic.size} / {members.length} present
          </span>
        </div>
        <ul className="divide-y divide-border/60">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </li>
          ) : (
            filtered.map((m) => {
              const checked = optimistic.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id, checked)}
                    disabled={pending}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      checked ? "bg-emerald-500/5" : "hover:bg-muted/40",
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      {m.image ? <AvatarImage src={m.image} alt={m.name ?? ""} /> : null}
                      <AvatarFallback className="text-xs">
                        {initialsFor(m.name, m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.name ?? "Unnamed"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                    <BeltBadge belt={m.belt} stripes={m.stripes} size="sm" />
                    <StatusIndicator checked={checked} pending={pending} />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

function StatusIndicator({ checked, pending }: { checked: boolean; pending: boolean }) {
  if (pending && !checked) {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-background text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full border transition-colors",
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />}
    </span>
  );
}
