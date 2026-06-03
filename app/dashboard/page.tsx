import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bandage,
  CalendarClock,
  CreditCard,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { BeltBadge } from "@/components/athlete/belt-badge";
import { RoleBadge } from "@/components/athlete/role-badge";
import { BELT_LABEL } from "@/lib/belts";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/db/scoped";
import { dayLabel, formatDate, relativeTime } from "@/lib/format";
import type { BeltRank } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ROLE_COPY: Record<string, { title: string; lead: string }> = {
  ADMIN: {
    title: "Run your gym",
    lead: "Memberships, classes, attendance, and billing — all from here.",
  },
  COACH: {
    title: "Run your mats",
    lead: "Take attendance, promote athletes, and plan your next class.",
  },
  STUDENT: {
    title: "Train smarter",
    lead: "Book classes, track your mat hours, and watch your stripes pile up.",
  },
};

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function DashboardHome() {
  const { session, gymId } = await requireGymId();
  const copy = ROLE_COPY[session.user.role] ?? ROLE_COPY.STUDENT;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    gym,
    totals,
    recentMembers,
    weeklyClasses,
    recentPromotions,
    activeInjuries,
    weekCheckIns,
  ] = await Promise.all([
      prisma.gym.findUnique({
        where: { id: gymId },
        select: { name: true, createdAt: true },
      }),
      prisma.$transaction([
        prisma.user.count({ where: { gymId } }),
        prisma.user.count({ where: { gymId, role: "COACH" } }),
        prisma.user.count({ where: { gymId, role: "STUDENT" } }),
        prisma.classDefinition.count({ where: { gymId } }),
      ]),
      prisma.user.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          belt: true,
          stripes: true,
          createdAt: true,
        },
      }),
      prisma.classDefinition.findMany({
        where: { gymId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        take: 4,
        include: {
          coach: { select: { name: true, email: true } },
        },
      }),
      prisma.beltPromotion.findMany({
        where: { gymId },
        orderBy: { awardedAt: "desc" },
        take: 4,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.injury.count({
        where: { gymId, status: { in: ["ACTIVE", "RECOVERING"] } },
      }),
      prisma.attendance.count({
        where: { gymId, checkedInAt: { gte: weekStart } },
      }),
    ]);

  const [memberCount, coachCount, studentCount, classCount] = totals;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <RoleBadge role={session.user.role} />
          {gym?.name ? <span>· {gym.name}</span> : null}
          {gym?.createdAt ? (
            <span className="text-xs">· founded {formatDate(gym.createdAt)}</span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {copy.title}, {session.user.name?.split(" ")[0] ?? "friend"}.
        </h1>
        <p className="max-w-xl text-muted-foreground">{copy.lead}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Members"
          value={memberCount}
          icon={Users}
          hint={`${coachCount} coach${coachCount === 1 ? "" : "es"} · ${studentCount} student${studentCount === 1 ? "" : "s"}`}
        />
        <StatsCard
          label="Check-ins this week"
          value={weekCheckIns}
          icon={LineChart}
          hint="last 7 days"
        />
        <StatsCard
          label="Recurring classes"
          value={classCount}
          icon={CalendarClock}
          hint="weekly schedule"
        />
        <StatsCard
          label="Active injuries"
          value={activeInjuries}
          icon={Bandage}
          hint={activeInjuries === 0 ? "Everyone's healthy" : "Plan sparring carefully"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent members</CardTitle>
              <CardDescription>The newest faces on the mats.</CardDescription>
            </div>
            <Link
              href="/dashboard/members"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1",
              )}
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="divide-y divide-border/60 p-0">
            {recentMembers.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                No members yet — invite your first.
              </p>
            ) : (
              recentMembers.map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/members/${m.id}`}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="h-8 w-8">
                    {m.image ? <AvatarImage src={m.image} alt={m.name ?? ""} /> : null}
                    <AvatarFallback className="text-xs">
                      {initialsFor(m.name, m.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name ?? "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Joined {relativeTime(m.createdAt)}
                    </p>
                  </div>
                  <BeltBadge belt={m.belt} stripes={m.stripes} size="sm" />
                  <RoleBadge role={m.role} className="hidden sm:inline-flex" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base font-semibold">This week</CardTitle>
              <CardDescription>Next sessions on the schedule.</CardDescription>
            </div>
            <Link
              href="/dashboard/classes"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1",
              )}
            >
              All classes
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-2 p-4">
            {weeklyClasses.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No classes scheduled yet.
              </p>
            ) : (
              weeklyClasses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayLabel(c.dayOfWeek)} · {c.startTime}
                      {c.coach?.name ? ` · ${c.coach.name}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {c.durationMin}m
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base font-semibold">Recent promotions</CardTitle>
              <CardDescription>Belts and stripes awarded across the gym.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {recentPromotions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No promotions yet — head to a member&apos;s profile and award the first.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentPromotions.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/members/${p.user.id}?tab=training`}
                    className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.user.name ?? p.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.fromBelt && p.fromBelt !== p.toBelt
                          ? `Promoted ${BELT_LABEL[p.fromBelt as BeltRank]} → ${BELT_LABEL[p.toBelt]}`
                          : p.toStripes > p.fromStripes
                          ? `+${p.toStripes - p.fromStripes} stripe${
                              p.toStripes - p.fromStripes === 1 ? "" : "s"
                            } on ${BELT_LABEL[p.toBelt]}`
                          : `${BELT_LABEL[p.toBelt]} belt`}{" "}
                        · {relativeTime(p.awardedAt)}
                      </p>
                    </div>
                    <BeltBadge belt={p.toBelt} stripes={p.toStripes} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">What&apos;s next on the roadmap</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Phase 6 · Booking
            </div>
            <p className="text-muted-foreground">
              Reservations, waitlists, recurring sessions.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              Phase 7 · Library
            </div>
            <p className="text-muted-foreground">
              Technique video library, tags, positions.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              Phase 8 · Billing
            </div>
            <p className="text-muted-foreground">
              Stripe subscriptions, invoices, and webhooks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
