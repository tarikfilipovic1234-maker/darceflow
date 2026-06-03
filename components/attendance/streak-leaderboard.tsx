import Link from "next/link";
import { Flame, Trophy } from "lucide-react";

import { BeltBadge } from "@/components/athlete/belt-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BeltRank } from "@/lib/generated/prisma/enums";

type LeaderboardRow = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  belt: BeltRank | null;
  stripes: number;
  currentStreak: number;
  longestStreak: number;
  totalMatHours: number;
};

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function StreakLeaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No streaks yet"
        description="Once people start checking in, the top streaks land here."
      />
    );
  }

  return (
    <ol className="divide-y divide-border/60">
      {rows.map((r, i) => (
        <li key={r.userId}>
          <Link
            href={`/dashboard/members/${r.userId}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-xs font-medium",
                i === 0
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : i === 1
                  ? "bg-zinc-400/20 text-zinc-700 dark:text-zinc-300"
                  : i === 2
                  ? "bg-orange-600/15 text-orange-700 dark:text-orange-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <Avatar className="h-7 w-7">
              {r.image ? <AvatarImage src={r.image} alt={r.name ?? ""} /> : null}
              <AvatarFallback className="text-xs">
                {initialsFor(r.name, r.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.name ?? r.email}</p>
              <p className="text-xs text-muted-foreground">
                {r.totalMatHours}h total · best {r.longestStreak}d
              </p>
            </div>
            <BeltBadge belt={r.belt} stripes={r.stripes} size="sm" />
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Flame className="h-3 w-3" />
              {r.currentStreak}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
