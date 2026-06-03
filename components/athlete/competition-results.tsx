import { Award, Medal, Trash2, Trophy } from "lucide-react";

import { deleteCompetitionAction } from "@/app/dashboard/members/[id]/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { CompetitionPlacement } from "@/lib/generated/prisma/enums";
import { PLACEMENT_LABEL } from "@/lib/validators/competitions";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  eventName: string;
  division: string | null;
  weightClassKg: number | null;
  placement: CompetitionPlacement;
  wins: number;
  losses: number;
  competedAt: Date;
  note: string | null;
};

const placementClass: Record<CompetitionPlacement, string> = {
  GOLD: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  SILVER: "bg-zinc-400/20 text-zinc-700 dark:text-zinc-300 border-zinc-400/30",
  BRONZE: "bg-orange-600/15 text-orange-700 dark:text-orange-300 border-orange-600/30",
  FOURTH: "bg-muted text-muted-foreground border-border",
  DNP: "bg-muted text-muted-foreground border-border",
};

const placementIcon: Record<CompetitionPlacement, React.ElementType> = {
  GOLD: Trophy,
  SILVER: Medal,
  BRONZE: Medal,
  FOURTH: Award,
  DNP: Award,
};

export function CompetitionResults({
  userId,
  results,
}: {
  userId: string;
  results: Result[];
}) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No competition results yet"
        description="Wins, losses, podiums — log every event to build the athlete's record."
      />
    );
  }

  const totalWins = results.reduce((s, r) => s + r.wins, 0);
  const totalLosses = results.reduce((s, r) => s + r.losses, 0);
  const podiums = results.filter((r) => ["GOLD", "SILVER", "BRONZE"].includes(r.placement)).length;
  const golds = results.filter((r) => r.placement === "GOLD").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label="Events" value={results.length} />
        <SummaryTile label="W – L" value={`${totalWins} – ${totalLosses}`} />
        <SummaryTile label="Podiums" value={podiums} />
        <SummaryTile label="Golds" value={golds} />
      </div>

      <div className="space-y-2">
        {results.map((r) => {
          const Icon = placementIcon[r.placement];
          return (
            <Card key={r.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{r.eventName}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", placementClass[r.placement])}
                    >
                      {PLACEMENT_LABEL[r.placement]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(r.competedAt)}
                    {r.division ? ` · ${r.division}` : ""}
                    {r.weightClassKg ? ` · ${r.weightClassKg}kg` : ""}
                    {" · "}
                    {r.wins}W&nbsp;–&nbsp;{r.losses}L
                  </p>
                  {r.note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>
                  ) : null}
                </div>
                <form action={deleteCompetitionAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="userId" value={userId} />
                  <button
                    type="submit"
                    aria-label="Delete result"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
