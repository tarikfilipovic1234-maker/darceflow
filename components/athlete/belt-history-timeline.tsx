import { BeltBadge } from "@/components/athlete/belt-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { BELT_LABEL } from "@/lib/belts";
import { formatDate } from "@/lib/format";
import type { BeltRank } from "@/lib/generated/prisma/enums";
import { Trophy } from "lucide-react";

type Promotion = {
  id: string;
  fromBelt: BeltRank | null;
  fromStripes: number;
  toBelt: BeltRank;
  toStripes: number;
  awardedAt: Date;
  note: string | null;
  awardedBy: { id: string; name: string | null; email: string | null } | null;
};

function summary(p: Promotion): string {
  if (!p.fromBelt) return `${BELT_LABEL[p.toBelt]} belt awarded`;
  if (p.fromBelt !== p.toBelt) {
    return `Promoted ${BELT_LABEL[p.fromBelt]} → ${BELT_LABEL[p.toBelt]}`;
  }
  if (p.toStripes > p.fromStripes) {
    const delta = p.toStripes - p.fromStripes;
    return `+${delta} stripe${delta === 1 ? "" : "s"} on ${BELT_LABEL[p.toBelt]}`;
  }
  if (p.toStripes < p.fromStripes) {
    return `Stripes reset to ${p.toStripes} on ${BELT_LABEL[p.toBelt]}`;
  }
  return `Rank updated to ${BELT_LABEL[p.toBelt]}`;
}

export function BeltHistoryTimeline({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No promotions yet"
        description="Every belt and stripe awarded here will show up in this timeline."
      />
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-border/60 pl-6">
      {promotions.map((p, idx) => (
        <li key={p.id} className="relative">
          <span
            className="absolute -left-[33px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-border bg-background"
            aria-hidden
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (idx === 0 ? "bg-foreground" : "bg-muted-foreground")
              }
            />
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{summary(p)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(p.awardedAt)}
                {p.awardedBy?.name ? ` · by ${p.awardedBy.name}` : ""}
              </p>
            </div>
            <BeltBadge belt={p.toBelt} stripes={p.toStripes} size="sm" />
          </div>
          {p.note ? (
            <p className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {p.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
