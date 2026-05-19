import { cn } from "@/lib/utils";

type BeltColor = "white" | "blue" | "purple" | "brown" | "black";

const beltClass: Record<BeltColor, string> = {
  white: "bg-zinc-100 ring-zinc-200",
  blue: "bg-blue-600 ring-blue-700",
  purple: "bg-purple-600 ring-purple-700",
  brown: "bg-amber-800 ring-amber-900",
  black: "bg-zinc-950 ring-zinc-900",
};

function Belt({
  color,
  stripes,
  current,
}: {
  color: BeltColor;
  stripes: number;
  current?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-7 w-32 overflow-hidden rounded-sm shadow-inner ring-1",
        beltClass[color],
        current && "ring-2 ring-offset-2 ring-offset-background ring-foreground",
      )}
    >
      <div className="absolute inset-y-0 right-1 flex items-center gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-[3px] rounded-[1px]",
              i < stripes ? "bg-white/90" : "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}

const timeline: Array<{
  color: BeltColor;
  stripes: number;
  label: string;
  date: string;
  current?: boolean;
}> = [
  { color: "white", stripes: 4, label: "White belt", date: "2021 · Started" },
  { color: "blue", stripes: 4, label: "Blue belt", date: "2023 · Promoted" },
  { color: "purple", stripes: 2, label: "Purple belt", date: "2025 · Current", current: true },
  { color: "brown", stripes: 0, label: "Brown belt", date: "Up next" },
];

export function BeltShowcase() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Belt progression
          </span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Every stripe, every promotion, every moment that matters.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Belt promotions are awarded by coaches in two clicks, with notes, dates, and a
            timeline that survives gym moves, coaching changes, and the occasional missing
            certificate.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
              Stripe and belt history with awarding coach attribution
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
              Competition record per athlete — weight class, division, placement
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
              Injury log so coaches know what to avoid in sparring
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm">
          <div className="relative space-y-7">
            <div
              aria-hidden
              className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-border via-border to-transparent"
            />
            {timeline.map((item) => (
              <div key={item.label} className="relative flex items-center gap-6">
                <span
                  className={cn(
                    "z-10 h-8 w-8 rounded-full border-2 bg-background",
                    item.current ? "border-foreground" : "border-border",
                  )}
                />
                <div className="flex flex-1 items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <Belt color={item.color} stripes={item.stripes} current={item.current} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
