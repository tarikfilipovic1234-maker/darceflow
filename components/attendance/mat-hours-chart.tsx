"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MatHoursPoint = { weekLabel: string; hours: number; cumulative: number };

export function MatHoursChart({ data }: { data: MatHoursPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        No training data yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="matHoursFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.4}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid color-mix(in oklch, var(--border) 80%, transparent)",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
              color: "var(--popover-foreground)",
            }}
            formatter={(value) => [`${String(value)}h this week`, "Mat hours"]}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="currentColor"
            strokeWidth={2}
            fill="url(#matHoursFill)"
            className="text-emerald-500"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
