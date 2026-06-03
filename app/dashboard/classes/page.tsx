import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireGymId, requireSession } from "@/lib/db/scoped";
import { DAYS_OF_WEEK_SHORT, dayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Classes" };

const ROLE_CAN_CREATE = new Set(["ADMIN", "COACH"]);

export default async function ClassesPage() {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const canCreate = ROLE_CAN_CREATE.has(session.user.role);

  const classes = await prisma.classDefinition.findMany({
    where: { gymId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      coach: { select: { id: true, name: true, email: true } },
    },
  });

  // Group by weekday for the week-grid view.
  const byDay = new Map<number, typeof classes>();
  for (const c of classes) {
    if (!byDay.has(c.dayOfWeek)) byDay.set(c.dayOfWeek, []);
    byDay.get(c.dayOfWeek)!.push(c);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Classes"
        description="The weekly schedule that runs your gym."
        actions={
          canCreate ? (
            <Link
              href="/dashboard/classes/new"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Plus className="h-4 w-4" />
              Add class
            </Link>
          ) : null
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No classes scheduled yet"
          description={
            canCreate
              ? "Add your first class to start building the weekly schedule."
              : "Once your coaches add classes, they'll show up here."
          }
          action={
            canCreate ? (
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {DAYS_OF_WEEK_SHORT.map((label, dayIdx) => {
            const dayClasses = byDay.get(dayIdx) ?? [];
            return (
              <div
                key={label}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>{dayLabel(dayIdx)}</span>
                  <span className="text-foreground">{dayClasses.length}</span>
                </div>
                {dayClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Rest day</p>
                ) : (
                  dayClasses.map((c) => (
                    <Card key={c.id} className="border-border/70 bg-card">
                      <CardHeader className="space-y-1.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{c.name}</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {c.startTime}
                          </Badge>
                        </div>
                        {c.description ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {c.description}
                          </p>
                        ) : null}
                      </CardHeader>
                      <CardContent className="flex items-center justify-between gap-2 py-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {c.durationMin}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {c.capacity}
                        </span>
                      </CardContent>
                      {c.coach ? (
                        <CardContent className="border-t border-border/40 py-2 text-xs">
                          <span className="text-muted-foreground">Coach</span>{" "}
                          <span className="font-medium">
                            {c.coach.name ?? c.coach.email}
                          </span>
                        </CardContent>
                      ) : null}
                    </Card>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
