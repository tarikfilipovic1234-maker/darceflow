import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AtSign, CalendarDays, Lock } from "lucide-react";

import { ChangeRoleForm } from "@/app/dashboard/members/[id]/change-role-form";
import { PromoteBeltForm } from "@/app/dashboard/members/[id]/promote-belt-form";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { RoleBadge } from "@/components/athlete/role-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: member?.name ?? member?.email ?? "Member" };
}

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const { id } = await params;

  const member = await prisma.user.findFirst({
    where: { id, gymId },
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
  });

  if (!member) notFound();

  const canChangeRole = session.user.role === "ADMIN" && member.id !== session.user.id;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/dashboard/members"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to members
      </Link>

      <PageHeader
        title={member.name ?? member.email ?? "Member"}
        description="Profile, rank, and permissions."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="h-20 w-20">
              {member.image ? <AvatarImage src={member.image} alt={member.name ?? ""} /> : null}
              <AvatarFallback className="text-lg">
                {initialsFor(member.name, member.email)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-3 text-lg">
              {member.name ?? "Unnamed"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <AtSign className="h-3 w-3" />
              {member.email ?? "no email"}
            </CardDescription>
            <div className="mt-3 flex items-center gap-2">
              <RoleBadge role={member.role} />
              <BeltBadge belt={member.belt} stripes={member.stripes} size="sm" />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-3 py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                <CalendarDays className="mr-1.5 inline h-3.5 w-3.5" />
                Joined
              </span>
              <span>{formatDate(member.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                Member ID
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {member.id.slice(0, 12)}…
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Belt promotion</CardTitle>
              <CardDescription>
                One click to add a stripe, or pick a belt to promote directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromoteBeltForm
                userId={member.id}
                currentBelt={member.belt}
                currentStripes={member.stripes}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Role</CardTitle>
              <CardDescription>
                {canChangeRole
                  ? "Admins can promote a coach or demote to student."
                  : session.user.role !== "ADMIN"
                  ? "Only admins can change roles."
                  : "You cannot change your own role."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canChangeRole ? (
                <ChangeRoleForm userId={member.id} currentRole={member.role} />
              ) : (
                <div className="flex items-center gap-3">
                  <RoleBadge role={member.role} />
                  <span className="text-sm text-muted-foreground">Locked</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Coming in Phase 4</CardTitle>
              <CardDescription>
                Belt-history timeline, competition record, injury log, weight class, and
                training-history charts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
