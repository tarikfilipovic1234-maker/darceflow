import { Activity, Bandage, Trash2 } from "lucide-react";

import {
  deleteInjuryAction,
  updateInjuryStatusAction,
} from "@/app/dashboard/members/[id]/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type {
  BodyPart,
  InjurySeverity,
  InjuryStatus,
} from "@/lib/generated/prisma/enums";
import {
  BODY_PART_LABEL,
  SEVERITY_LABEL,
  STATUS_LABEL,
} from "@/lib/validators/injuries";
import { cn } from "@/lib/utils";

type Injury = {
  id: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  status: InjuryStatus;
  startedAt: Date;
  resolvedAt: Date | null;
  note: string | null;
};

const severityClass: Record<InjurySeverity, string> = {
  MINOR: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  MODERATE: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  SEVERE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const statusClass: Record<InjuryStatus, string> = {
  ACTIVE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  RECOVERING: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

const NEXT_STATUS: Record<InjuryStatus, { next: InjuryStatus; label: string } | null> = {
  ACTIVE: { next: "RECOVERING", label: "Mark recovering" },
  RECOVERING: { next: "RESOLVED", label: "Mark resolved" },
  RESOLVED: null,
};

export function InjuryList({
  userId,
  injuries,
}: {
  userId: string;
  injuries: Injury[];
}) {
  if (injuries.length === 0) {
    return (
      <EmptyState
        icon={Bandage}
        title="No injuries on the log"
        description="When something tweaks, log it here so coaches know what to avoid in sparring."
      />
    );
  }

  const active = injuries.filter((i) => i.status !== "RESOLVED");
  const resolved = injuries.filter((i) => i.status === "RESOLVED");

  return (
    <div className="space-y-6">
      {active.length > 0 ? (
        <Section title="Active" icon={Activity} items={active} userId={userId} />
      ) : null}
      {resolved.length > 0 ? (
        <Section title="Resolved" icon={Bandage} items={resolved} userId={userId} muted />
      ) : null}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  items,
  userId,
  muted,
}: {
  title: string;
  icon: React.ElementType;
  items: Injury[];
  userId: string;
  muted?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {title} ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((i) => {
          const advance = NEXT_STATUS[i.status];
          return (
            <Card key={i.id} className={cn(muted && "opacity-80")}>
              <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{BODY_PART_LABEL[i.bodyPart]}</p>
                    <Badge variant="outline" className={cn("text-xs", severityClass[i.severity])}>
                      {SEVERITY_LABEL[i.severity]}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", statusClass[i.status])}>
                      {STATUS_LABEL[i.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Started {formatDate(i.startedAt)}
                    {i.resolvedAt ? ` · resolved ${formatDate(i.resolvedAt)}` : ""}
                  </p>
                  {i.note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{i.note}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  {advance ? (
                    <form action={updateInjuryStatusAction}>
                      <input type="hidden" name="injuryId" value={i.id} />
                      <input type="hidden" name="userId" value={userId} />
                      <input type="hidden" name="status" value={advance.next} />
                      <Button type="submit" size="sm" variant="outline">
                        {advance.label}
                      </Button>
                    </form>
                  ) : null}
                  <form action={deleteInjuryAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="userId" value={userId} />
                    <button
                      type="submit"
                      aria-label="Delete injury"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
