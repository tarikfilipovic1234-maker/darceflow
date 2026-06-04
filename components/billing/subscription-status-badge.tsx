import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: "Trialing",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
};

const CLASS: Record<SubscriptionStatus, string> = {
  TRIALING: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ACTIVE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PAST_DUE: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  CANCELED: "border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  INCOMPLETE: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", CLASS[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
