import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";

import {
  BookButton,
  CapacityPill,
  type BookingStatus,
} from "@/components/booking/book-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { expandRecurringSessions } from "@/lib/scheduling/expand-recurrence";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/db/scoped";
import { dayLabel, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Schedule" };

const DAYS_AHEAD = 14;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayHeading(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
  return fmt.format(d);
}

export default async function SchedulePage() {
  const { session, gymId } = await requireGymId();

  // Make sure sessions exist for the next two weeks before we render.
  await expandRecurringSessions({ gymId, days: DAYS_AHEAD });

  const now = new Date();
  now.setMinutes(now.getMinutes() - 30); // grace window — show classes that just started
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + DAYS_AHEAD);

  const sessions = await prisma.classSession.findMany({
    where: {
      gymId,
      scheduledAt: { gte: now, lte: horizon },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      classDefinition: {
        select: {
          name: true,
          description: true,
          capacity: true,
          coach: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { reservations: true, waitlistEntries: true } },
      reservations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      waitlistEntries: {
        where: { userId: session.user.id },
        select: { position: true },
      },
    },
  });

  // Group by date.
  const buckets = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = dateKey(s.scheduledAt);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(s);
  }
  const ordered = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));

  const isStaff = session.user.role !== "STUDENT";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Schedule"
        description="Upcoming classes — book, join the waitlist, or cancel."
        actions={
          isStaff ? (
            <Link
              href="/dashboard/classes/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Add class
            </Link>
          ) : null
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing scheduled in the next two weeks"
          description={
            isStaff
              ? "Add a class template and the schedule fills itself."
              : "Check back after your coaches put new classes on the calendar."
          }
          action={
            isStaff ? (
              <Link
                href="/dashboard/classes/new"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Add class
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-8">
          {ordered.map(([key, dayClasses]) => {
            const date = new Date(`${key}T00:00:00`);
            return (
              <section key={key} className="space-y-2">
                <header className="flex items-baseline justify-between">
                  <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {dayHeading(date)}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {dayClasses.length} class{dayClasses.length === 1 ? "" : "es"}
                  </span>
                </header>
                <div className="space-y-2">
                  {dayClasses.map((s) => {
                    const reserved = s.reservations.length > 0;
                    const waitlistPos = s.waitlistEntries[0]?.position ?? null;
                    const capacity = s.classDefinition.capacity;
                    const filled = s._count.reservations;
                    const passed = s.scheduledAt < new Date();

                    let bookingStatus: BookingStatus;
                    if (reserved) bookingStatus = { kind: "reserved" };
                    else if (waitlistPos !== null)
                      bookingStatus = { kind: "waitlisted", position: waitlistPos };
                    else if (filled >= capacity)
                      bookingStatus = {
                        kind: "full",
                        waitlistAhead: s._count.waitlistEntries,
                      };
                    else
                      bookingStatus = {
                        kind: "open",
                        spotsLeft: capacity - filled,
                      };

                    return (
                      <Card key={s.id}>
                        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                          <div className="w-16 shrink-0 text-sm">
                            <p className="font-mono text-base font-medium">
                              {formatTime(s.scheduledAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dayLabel(s.scheduledAt.getDay())}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={
                                  isStaff
                                    ? `/dashboard/schedule/${s.id}`
                                    : "#"
                                }
                                className="text-sm font-medium hover:underline"
                              >
                                {s.classDefinition.name}
                              </Link>
                              <CapacityPill filled={filled} capacity={capacity} />
                              {s._count.waitlistEntries > 0 ? (
                                <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs text-amber-700 dark:text-amber-300">
                                  +{s._count.waitlistEntries} waitlist
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {s.classDefinition.coach?.name
                                ? `${s.classDefinition.coach.name} · `
                                : ""}
                              <Clock className="mr-0.5 inline h-3 w-3" />
                              {s.durationMin}m
                              {s.classDefinition.description ? (
                                <>
                                  {" · "}
                                  <span className="line-clamp-1">
                                    {s.classDefinition.description}
                                  </span>
                                </>
                              ) : null}
                            </p>
                          </div>
                          <BookButton
                            sessionId={s.id}
                            status={bookingStatus}
                            passed={passed}
                            manageHref={
                              isStaff
                                ? `/dashboard/schedule/${s.id}`
                                : undefined
                            }
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
