import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, ScanLine } from "lucide-react";

import { CheckInRoster } from "@/components/attendance/check-in-roster";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { materializeSessionsForDate } from "@/lib/attendance/sessions";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { dayLabel, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Check-in" };

const VALID_PARAM = /^[0-9a-z]{20,30}$/;

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const sp = await searchParams;

  const today = new Date();

  // Ensure today's sessions exist before we render the picker.
  await materializeSessionsForDate(today, gymId);

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const todaysSessions = await prisma.classSession.findMany({
    where: {
      gymId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      classDefinition: {
        select: {
          name: true,
          dayOfWeek: true,
          coach: { select: { name: true, email: true } },
        },
      },
      _count: { select: { attendances: true } },
    },
  });

  const requestedId = sp.session && VALID_PARAM.test(sp.session) ? sp.session : null;
  const selected =
    todaysSessions.find((s) => s.id === requestedId) ?? todaysSessions[0] ?? null;

  if (!selected) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          title="Check-in"
          description={`Today is ${dayLabel(today.getDay())}.`}
        />
        <EmptyState
          icon={CalendarClock}
          title="No classes today"
          description="Once a class is on the schedule for today's weekday, the roster lands here."
          action={
            <Link
              href="/dashboard/classes/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Add a class
            </Link>
          }
        />
      </div>
    );
  }

  const [roster, currentAttendance] = await Promise.all([
    prisma.user.findMany({
      where: { gymId, role: { in: ["STUDENT", "COACH"] } },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        belt: true,
        stripes: true,
      },
    }),
    prisma.attendance.findMany({
      where: { classSessionId: selected.id },
      select: { userId: true },
    }),
  ]);

  const checkedInIds = currentAttendance.map((a) => a.userId);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Check-in"
        description={`Take roll for today, ${dayLabel(today.getDay())}.`}
      />

      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {todaysSessions.map((s) => {
            const active = s.id === selected.id;
            return (
              <Link
                key={s.id}
                href={`/dashboard/check-in?session=${s.id}`}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  active
                    ? "border-foreground bg-card shadow-sm"
                    : "border-border/60 bg-card hover:border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.classDefinition.name}</p>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatTime(s.scheduledAt)}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {s.durationMin}m
                  {s.classDefinition.coach?.name
                    ? ` · ${s.classDefinition.coach.name}`
                    : ""}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-xs">
                  <ScanLine className="h-3 w-3" />
                  {s._count.attendances} checked in
                </p>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {selected.classDefinition.name}
                </CardTitle>
                <CardDescription>
                  {formatTime(selected.scheduledAt)} · {selected.durationMin} minutes
                  {selected.classDefinition.coach?.name
                    ? ` · ${selected.classDefinition.coach.name}`
                    : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CheckInRoster
              sessionId={selected.id}
              members={roster}
              initialCheckedIn={checkedInIds}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
