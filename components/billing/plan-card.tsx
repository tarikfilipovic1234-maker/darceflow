import { Check, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatMoney, intervalLabel } from "@/lib/money";
import type { SubscriptionInterval } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type PlanForCard = {
  id: string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  interval: SubscriptionInterval;
  features: string[];
};

export function PlanCard({
  plan,
  active,
  highlighted,
  action,
}: {
  plan: PlanForCard;
  active?: boolean;
  highlighted?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        active && "border-foreground/40 ring-2 ring-foreground/30",
        highlighted && !active && "border-foreground/30",
      )}
    >
      {highlighted ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
          <Sparkles className="h-3 w-3" />
          Popular
        </span>
      ) : null}
      <CardHeader>
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        {plan.description ? (
          <CardDescription>{plan.description}</CardDescription>
        ) : null}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight">
            {formatMoney(plan.amountCents, plan.currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            {intervalLabel(plan.interval)}
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-1 flex-col gap-3 py-4 text-sm">
        {plan.features.length > 0 ? (
          <ul className="flex-1 space-y-1.5 text-muted-foreground">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex-1 text-muted-foreground">No features listed.</p>
        )}
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
