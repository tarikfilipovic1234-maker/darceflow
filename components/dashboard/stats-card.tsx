import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
  className?: string;
}) {
  const trendClass =
    trend?.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend?.direction === "down"
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        {Icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardHeader>
      {(trend || hint) && (
        <CardContent className="flex items-center gap-2 text-xs">
          {trend ? <span className={trendClass}>{trend.value}</span> : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </CardContent>
      )}
    </Card>
  );
}
