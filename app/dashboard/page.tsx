import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/db/scoped";

export const metadata: Metadata = {
  title: "Dashboard",
};

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

export default async function DashboardHome() {
  const session = await requireSession();
  const copy = ROLE_COPY[session.user.role] ?? ROLE_COPY.STUDENT;

  const gym = session.user.gymId
    ? await prisma.gym.findUnique({
        where: { id: session.user.gymId },
        select: { name: true, createdAt: true, _count: { select: { users: true } } },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-mono">
            {session.user.role}
          </Badge>
          {gym?.name ? <span>· {gym.name}</span> : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {copy.title}, {session.user.name?.split(" ")[0] ?? "friend"}.
        </h1>
        <p className="max-w-xl text-muted-foreground">{copy.lead}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl">{gym?._count.users ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Full roster lands in Phase 3.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>This week&apos;s attendance</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Wired up in Phase 5.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active subscriptions</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Stripe integration arrives in Phase 8.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">What&apos;s next</CardTitle>
          <CardDescription>
            Phase 2 is live: sign-in, sign-up, and role-based protection. Phase 3 brings
            real member management.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
