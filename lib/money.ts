const cache = new Map<string, Intl.NumberFormat>();

function fmt(currency: string) {
  const key = currency.toLowerCase();
  const existing = cache.get(key);
  if (existing) return existing;
  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: key,
    maximumFractionDigits: 2,
  });
  cache.set(key, f);
  return f;
}

export function formatMoney(cents: number, currency: string = "usd"): string {
  return fmt(currency).format(cents / 100);
}

export function intervalLabel(interval: "MONTH" | "YEAR"): string {
  return interval === "MONTH" ? "/ mo" : "/ yr";
}
