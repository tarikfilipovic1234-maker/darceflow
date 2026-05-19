const stats = [
  { value: "10 → 1,000", label: "Athletes per gym" },
  { value: "5 belts", label: "White through black" },
  { value: "3 roles", label: "Admin · Coach · Student" },
  { value: "1 dashboard", label: "For everything" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border/60 px-px sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-6 text-center">
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
