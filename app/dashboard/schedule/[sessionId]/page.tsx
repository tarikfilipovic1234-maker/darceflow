import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";

import {
  promoteWaitlistAction,
  removeReservationAction,
} from "@/app/dashboard/schedule/actions";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { CapacityPill } from "@/components/booking/book-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { dayLabel, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const s = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { classDefinition: { select: { name: true } } },
  });
  return { title: s?.classDefinition.name ?? "Class session" };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const { sessionId } = await params;

  const session = await prisma.classSession.findFirst({
    where: { id: sessionId, gymId },
    include: {
      classDefinition: {
        select: {
          name: true,
          description: true,
          capacity: true,
          coach: { select: { name: true, email: true } },
        },
      },
      reservations: {
        orderBy: { createdAt: "asc" },
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
      },
      waitlistEntries: {
        orderBy: { position: "asc" },
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
      },
    },
  });

  if (!session) notFound();

  const capacity = session.classDefinition.capacity;
  const filled = session.reservations.length;
  const passed = session.scheduledAt < new Date();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/dashboard/schedule"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to schedule
      </Link>

      <PageHeader
        title={session.classDefinition.name}
        description={`${dayLabel(session.scheduledAt.getDay())} ${formatDate(session.scheduledAt)} · ${formatTime(session.scheduledAt)}`}
        actions={<CapacityPill filled={filled} capacity={capacity} />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{session.durationMin} minutes</span>
              {session.classDefinition.coach?.name ? (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm">{session.classDefinition.coach.name}</span>
                </>
              ) : null}
              {passed ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  This session has started or ended.
                </span>
              ) : null}
            </div>
            {session.classDefinition.description ? (
              <CardDescription>{session.classDefinition.description}</CardDescription>
            ) : null}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Reserved
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filled} / {capacity}
              </span>
            </CardTitle>
            <CardDescription>
              Cancelling a reservation auto-promotes the first person on the waitlist.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {session.reservations.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No reservations yet"
                description="Once members book, they'll line up here."
                className="rounded-none border-x-0 border-b-0"
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {session.reservations.map((r, idx) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      {r.user.image ? (
                        <AvatarImage src={r.user.image} alt={r.user.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initialsFor(r.user.name, r.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/members/${r.user.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {r.user.name ?? r.user.email}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.user.email}
                      </p>
                    </div>
                    <BeltBadge belt={r.user.belt} stripes={r.user.stripes} size="sm" />
                    <form action={removeReservationAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="userId" value={r.user.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Waitlist
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {session.waitlistEntries.length}
              </span>
            </CardTitle>
            <CardDescription>
              FIFO by default — coaches can promote anyone out of order.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {session.waitlistEntries.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No one waiting"
                description="The waitlist fills up when the class hits capacity."
                className="rounded-none border-x-0 border-b-0"
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {session.waitlistEntries.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                      #{w.position}
                    </span>
                    <Avatar className="h-8 w-8">
                      {w.user.image ? (
                        <AvatarImage src={w.user.image} alt={w.user.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initialsFor(w.user.name, w.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/members/${w.user.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {w.user.name ?? w.user.email}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {w.user.email}
                      </p>
                    </div>
                    <BeltBadge belt={w.user.belt} stripes={w.user.stripes} size="sm" />
                    <form action={promoteWaitlistAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="userId" value={w.user.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Promote
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
