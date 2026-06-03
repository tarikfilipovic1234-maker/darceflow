import Link from "next/link";

import { cn } from "@/lib/utils";

export type ProfileTab = "overview" | "training" | "competition" | "injuries";

const TABS: { value: ProfileTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "training", label: "Training" },
  { value: "competition", label: "Competition" },
  { value: "injuries", label: "Injuries" },
];

export function TabsNav({
  memberId,
  current,
  counts,
}: {
  memberId: string;
  current: ProfileTab;
  counts?: Partial<Record<ProfileTab, number>>;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-1">
      {TABS.map((tab) => {
        const active = tab.value === current;
        const href =
          tab.value === "overview"
            ? `/dashboard/members/${memberId}`
            : `/dashboard/members/${memberId}?tab=${tab.value}`;
        const count = counts?.[tab.value];
        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof count === "number" && count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active
                    ? "bg-muted text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
