import { cn } from "@/lib/utils";

const WEEKS = 26;
const DAYS = 7;

// Deterministic pseudo-random pattern so SSR + client agree.
function intensityFor(week: number, day: number) {
  const seed = (week * 31 + day * 17) % 11;
  if (day === 0 || day === 6) {
    return seed > 8 ? 2 : seed > 6 ? 1 : 0;
  }
  if (seed > 9) return 4;
  if (seed > 7) return 3;
  if (seed > 4) return 2;
  if (seed > 2) return 1;
  return 0;
}

const cellClass: Record<number, string> = {
  0: "bg-muted/60",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

export function MatHoursPreview() {
  const cells: Array<{ week: number; day: number; level: number }> = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      cells.push({ week: w, day: d, level: intensityFor(w, d) });
    }
  }

  return (
    <div className="relative rounded-2xl border border-border/70 bg-card/60 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium">Mat hours</span>
          <span className="text-muted-foreground">last 26 weeks</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={cn("h-2.5 w-2.5 rounded-sm", cellClass[l])}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div
        className="mt-4 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: WEEKS }).map((_, w) => (
          <div key={w} className="grid grid-rows-7 gap-[3px]">
            {Array.from({ length: DAYS }).map((_, d) => {
              const level = cells.find((c) => c.week === w && c.day === d)!.level;
              return (
                <span
                  key={d}
                  className={cn("aspect-square w-full rounded-[3px]", cellClass[level])}
                  aria-hidden
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>142 sessions logged</span>
        <span>9-week streak</span>
      </div>
    </div>
  );
}
