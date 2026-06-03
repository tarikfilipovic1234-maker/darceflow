"use client";

import { useTransition } from "react";
import { ChevronUp, Loader2 } from "lucide-react";

import { updateBeltAction } from "@/app/dashboard/members/actions";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { Button } from "@/components/ui/button";
import { BELT_LABEL, BELT_ORDER } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { BeltRank } from "@/lib/generated/prisma/enums";

export function PromoteBeltForm({
  userId,
  currentBelt,
  currentStripes,
}: {
  userId: string;
  currentBelt: BeltRank | null;
  currentStripes: number;
}) {
  const [pending, startTransition] = useTransition();

  function submit(belt: BeltRank, stripes: number) {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("belt", belt);
    fd.set("stripes", String(stripes));
    startTransition(async () => {
      await updateBeltAction(fd);
    });
  }

  function addStripe() {
    if (!currentBelt) {
      submit("WHITE", 1);
      return;
    }
    if (currentStripes >= 4) {
      const idx = BELT_ORDER.indexOf(currentBelt);
      const next = BELT_ORDER[idx + 1];
      if (next) submit(next, 0);
      return;
    }
    submit(currentBelt, currentStripes + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current rank</p>
          <div className="mt-1 flex items-center gap-3">
            <BeltBadge belt={currentBelt} stripes={currentStripes} size="lg" showLabel />
          </div>
        </div>
        <Button onClick={addStripe} disabled={pending} className="gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          {currentBelt && currentStripes >= 4 ? "Promote belt" : "Add stripe"}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {BELT_ORDER.map((b) => {
          const isCurrent = b === currentBelt;
          return (
            <button
              key={b}
              type="button"
              disabled={pending}
              onClick={() => submit(b, 0)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border px-2 py-2 text-xs transition-colors",
                isCurrent
                  ? "border-foreground bg-muted"
                  : "border-border/60 hover:border-border hover:bg-muted/60",
              )}
            >
              <BeltBadge belt={b} stripes={0} size="sm" />
              <span className="text-muted-foreground">{BELT_LABEL[b]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
