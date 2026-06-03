import { startOfLocalDay } from "@/lib/attendance/sessions";
import { cn } from "@/lib/utils";

type DayCount = { date: string; count: number };

const WEEKS = 26;
const DAYS = 7;

const LEVEL_CLASS = [
  "bg-muted/60",
  "bg-emerald-500/25",
  "bg-emerald-500/50",
  "bg-emerald-500/75",
  "bg-emerald-500",
];

function levelFor(count: number, max: number) {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const pct = count / max;
  if (pct > 0.75) return 4;
  if (pct > 0.5) return 3;
  if (pct > 0.25) return 2;
  return 1;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short" });

export function WeeklyHeatmap({
  data,
  title = "Attendance heatmap",
  subtitle,
}: {
  data: DayCount[];
  title?: string;
  subtitle?: string;
}) {
  const today = startOfLocalDay(new Date());
  // Anchor the grid to the most recent Saturday so weeks line up neatly.
  const lastColumnEnd = new Date(today);
  lastColumnEnd.setDate(lastColumnEnd.getDate() + (6 - lastColumnEnd.getDay()));

  const lookup = new Map(data.map((d) => [d.date, d.count]));
  const max = data.reduce((m, d) => Math.max(m, d.count), 0);

  const cells: { date: Date; count: number; level: number; future: boolean }[][] = [];
  const monthLabels: Array<{ index: number; label: string }> = [];
  let lastMonth = -1;

  for (let w = WEEKS - 1; w >= 0; w--) {
    const column: typeof cells[number] = [];
    for (let d = 0; d < DAYS; d++) {
      const cell = new Date(lastColumnEnd);
      cell.setDate(lastColumnEnd.getDate() - w * 7 - (DAYS - 1 - d));
      const count = lookup.get(isoDay(cell)) ?? 0;
      const future = cell > today;
      column.push({
        date: cell,
        count,
        level: future ? 0 : levelFor(count, max),
        future,
      });
    }
    cells.push(column);

    const firstOfColumn = column[0]?.date;
    if (firstOfColumn) {
      const m = firstOfColumn.getMonth();
      if (m !== lastMonth && firstOfColumn.getDate() <= 7) {
        monthLabels.push({ index: WEEKS - 1 - w, label: monthFmt.format(firstOfColumn) });
        lastMonth = m;
      }
    }
  }

  const totalSessions = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{totalSessions} sessions in 26 weeks</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          <div className="mt-5 flex flex-col gap-[3px] pr-1 text-[10px] text-muted-foreground">
            <span className="h-3 leading-3">Sun</span>
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Tue</span>
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Thu</span>
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Sat</span>
          </div>
          <div>
            <div className="relative mb-1 h-4 text-[10px] text-muted-foreground">
              {monthLabels.map((m) => (
                <span
                  key={`${m.index}-${m.label}`}
                  className="absolute"
                  style={{ left: `${m.index * 16}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col gap-[3px]">
              {cells.map((column, ci) => (
                <div key={ci} className="grid grid-rows-7 gap-[3px]">
                  {column.map((cell, ri) => (
                    <span
                      key={ri}
                      title={
                        cell.future
                          ? ""
                          : `${isoDay(cell.date)} — ${cell.count} session${cell.count === 1 ? "" : "s"}`
                      }
                      className={cn(
                        "h-3 w-3 rounded-[2px]",
                        cell.future ? "opacity-30" : "",
                        LEVEL_CLASS[cell.level],
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-[2px]", c)} aria-hidden />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
