import { BELT_CLASS, BELT_LABEL } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { BeltRank } from "@/lib/generated/prisma/enums";

type Size = "sm" | "md" | "lg";

const sizeBody: Record<Size, string> = {
  sm: "h-4 w-20",
  md: "h-5 w-24",
  lg: "h-6 w-28",
};
const sizeStripe: Record<Size, string> = {
  sm: "h-3 w-[2px]",
  md: "h-3.5 w-[2.5px]",
  lg: "h-4 w-[3px]",
};

export function BeltBadge({
  belt,
  stripes = 0,
  size = "md",
  showLabel = false,
  className,
}: {
  belt: BeltRank | null | undefined;
  stripes?: number;
  size?: Size;
  showLabel?: boolean;
  className?: string;
}) {
  if (!belt) {
    return (
      <span
        className={cn(
          "inline-flex items-center text-xs text-muted-foreground",
          className,
        )}
      >
        No rank
      </span>
    );
  }

  const safeStripes = Math.max(0, Math.min(4, stripes));

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-sm shadow-inner ring-1",
          BELT_CLASS[belt],
          sizeBody[size],
        )}
        aria-label={`${BELT_LABEL[belt]} belt, ${safeStripes} ${safeStripes === 1 ? "stripe" : "stripes"}`}
      >
        <span className="absolute inset-y-0 right-1 flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-[1px]",
                sizeStripe[size],
                i < safeStripes ? "bg-white/90" : "bg-white/10",
              )}
            />
          ))}
        </span>
      </span>
      {showLabel ? (
        <span className="text-xs text-muted-foreground">
          {BELT_LABEL[belt]}
          {safeStripes > 0 ? ` · ${safeStripes}` : ""}
        </span>
      ) : null}
    </span>
  );
}
