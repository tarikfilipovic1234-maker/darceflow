import type { Metadata } from "next";
import { Suspense } from "react";
import { Activity, CalendarRange, Flame, Trophy } from "lucide-react";

import { MatHoursChart, type MatHoursPoint } from "@/components/attendance/mat-hours-chart";
import { StreakLeaderboard } from "@/components/attendance/streak-leaderboard";
import { WeeklyHeatmap } from "@/components/attendance/weekly-heatmap";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfLocalDay } from "@/lib/attendance/sessions";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Analytics"
        description="Attendance, streaks, and mat-hour totals across the gym."
      />

      <div className="space-y-6">
        <Suspense fallback={<StatsRowSkeleton />}>
          <StatsRow gymId={gymId} />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attendance heatmap</CardTitle>
            <CardDescription>
              Daily check-in volume across the gym. Each tile is one day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-44 w-full" />}>
              <HeatmapPanel gymId={gymId} />
            </Suspense>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Mat hours per week</CardTitle>
              <CardDescription>
                Total training hours across the gym, last 12 weeks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <MatHoursPanel gymId={gymId} />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Streak leaderboard</CardTitle>
              <CardDescription>Top current streaks across the gym.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<LeaderboardSkeleton />}>
                <LeaderboardPanel gymId={gymId} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function StatsRow({ gymId }: { gymId: string }) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [weekCount, todayCount, longestStreak, totalHours] = await Promise.all([
    prisma.attendance.count({
      where: { gymId, checkedInAt: { gte: since } },
    }),
    prisma.attendance.count({
      where: { gymId, checkedInAt: { gte: startOfLocalDay() } },
    }),
    prisma.athleteStats.aggregate({
      where: { gymId },
      _max: { longestStreak: true },
    }),
    prisma.athleteStats.aggregate({
      where: { gymId },
      _sum: { totalMatHours: true },
    }),
  ]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        label="Today's check-ins"
        value={todayCount}
        icon={CalendarRange}
        hint="across every class today"
      />
      <StatsCard
        label="Last 7 days"
        value={weekCount}
        icon={Activity}
        hint="total check-ins"
      />
      <StatsCard
        label="Total mat hours"
        value={totalHours._sum.totalMatHours ?? 0}
        icon={Trophy}
        hint="across all members"
      />
      <StatsCard
        label="Longest streak"
        value={longestStreak._max.longestStreak ?? 0}
        icon={Flame}
        hint="days in a row"
      />
    </div>
  );
}

function StatsRowSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

async function HeatmapPanel({ gymId }: { gymId: string }) {
  const since = new Date();
  since.setDate(since.getDate() - 26 * 7);

  const rows = await prisma.attendance.findMany({
    where: { gymId, checkedInAt: { gte: since } },
    select: { checkedInAt: true },
  });

  const buckets = new Map<string, number>();
  for (const r of rows) {
    const key = r.checkedInAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const data = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));

  return <WeeklyHeatmap data={data} subtitle="Last 26 weeks across every class" />;
}

async function MatHoursPanel({ gymId }: { gymId: string }) {
  const since = new Date();
  since.setDate(since.getDate() - 12 * 7);

  const rows = await prisma.attendance.findMany({
    where: { gymId, checkedInAt: { gte: since } },
    select: { checkedInAt: true, durationMin: true },
    orderBy: { checkedInAt: "asc" },
  });

  // Bucket by ISO-week starting Monday.
  const weekKey = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay() || 7;
    x.setDate(x.getDate() - day + 1);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const buckets = new Map<string, { weekStart: Date; minutes: number }>();
  for (const r of rows) {
    const start = weekKey(r.checkedInAt);
    const key = start.toISOString();
    const existing = buckets.get(key);
    if (existing) existing.minutes += r.durationMin;
    else buckets.set(key, { weekStart: start, minutes: r.durationMin });
  }

  // Fill in any empty weeks so the line doesn't skip.
  const now = new Date();
  const lastWeek = weekKey(now);
  let cursor = weekKey(since);
  const ordered: { weekStart: Date; minutes: number }[] = [];
  while (cursor <= lastWeek) {
    const key = cursor.toISOString();
    ordered.push(buckets.get(key) ?? { weekStart: new Date(cursor), minutes: 0 });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }

  const fmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
  let running = 0;
  const data: MatHoursPoint[] = ordered.map((b) => {
    const hours = Math.round(b.minutes / 60);
    running += hours;
    return {
      weekLabel: fmt.format(b.weekStart),
      hours,
      cumulative: running,
    };
  });

  return <MatHoursChart data={data} />;
}

async function LeaderboardPanel({ gymId }: { gymId: string }) {
  const rows = await prisma.athleteStats.findMany({
    where: { gymId, currentStreak: { gt: 0 } },
    orderBy: [{ currentStreak: "desc" }, { longestStreak: "desc" }],
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          belt: true,
          stripes: true,
        },
      },
    },
  });

  const data = rows.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    image: r.user.image,
    belt: r.user.belt,
    stripes: r.user.stripes,
    currentStreak: r.currentStreak,
    longestStreak: r.longestStreak,
    totalMatHours: r.totalMatHours,
  }));

  return <StreakLeaderboard rows={data} />;
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
