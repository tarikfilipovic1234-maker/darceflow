"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Hourglass, Loader2, X } from "lucide-react";

import {
  cancelReservationAction,
  leaveWaitlistAction,
  reserveSpotAction,
} from "@/app/dashboard/schedule/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BookingStatus =
  | { kind: "open"; spotsLeft: number }
  | { kind: "full"; waitlistAhead: number }
  | { kind: "reserved" }
  | { kind: "waitlisted"; position: number };

export function BookButton({
  sessionId,
  status,
  passed,
  manageHref,
}: {
  sessionId: string;
  status: BookingStatus;
  passed: boolean;
  manageHref?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(
    status,
    (_current, next: BookingStatus) => next,
  );

  function book() {
    startTransition(async () => {
      applyOptimistic(
        status.kind === "full"
          ? { kind: "waitlisted", position: status.waitlistAhead + 1 }
          : { kind: "reserved" },
      );
      const fd = new FormData();
      fd.set("sessionId", sessionId);
      await reserveSpotAction(fd);
    });
  }

  function cancel() {
    startTransition(async () => {
      applyOptimistic({ kind: "open", spotsLeft: 1 });
      const fd = new FormData();
      fd.set("sessionId", sessionId);
      if (status.kind === "reserved") {
        await cancelReservationAction(fd);
      } else if (status.kind === "waitlisted") {
        await leaveWaitlistAction(fd);
      }
    });
  }

  if (passed) {
    return (
      <Button variant="ghost" size="sm" disabled className="cursor-not-allowed">
        Past
      </Button>
    );
  }

  switch (optimistic.kind) {
    case "reserved":
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={cancel}
          disabled={pending}
          className={cn(
            "gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
          )}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Reserved
        </Button>
      );
    case "waitlisted":
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={cancel}
          disabled={pending}
          className={cn(
            "gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200",
          )}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hourglass className="h-3.5 w-3.5" />}
          Waitlist #{optimistic.position}
        </Button>
      );
    case "open":
      return (
        <div className="flex items-center gap-1.5">
          <Button onClick={book} size="sm" disabled={pending}>
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Book
          </Button>
          {manageHref ? (
            <a
              href={manageHref}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Manage
            </a>
          ) : null}
        </div>
      );
    case "full":
      return (
        <div className="flex items-center gap-1.5">
          <Button onClick={book} size="sm" variant="outline" disabled={pending} className="gap-1.5">
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Hourglass className="h-3.5 w-3.5" />
            )}
            Waitlist
          </Button>
          {manageHref ? (
            <a
              href={manageHref}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Manage
            </a>
          ) : null}
        </div>
      );
  }
}

export function CapacityPill({ filled, capacity }: { filled: number; capacity: number }) {
  const ratio = capacity === 0 ? 0 : filled / capacity;
  const tone =
    ratio >= 1
      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : ratio >= 0.75
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-xs",
        tone,
      )}
    >
      {filled}/{capacity}
      {ratio >= 1 ? <X className="h-3 w-3" /> : null}
    </span>
  );
}
