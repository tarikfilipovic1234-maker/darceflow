import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AtSign, CalendarDays, Lock, Scale } from "lucide-react";

import { ChangeRoleForm } from "@/app/dashboard/members/[id]/change-role-form";
import { PromoteBeltForm } from "@/app/dashboard/members/[id]/promote-belt-form";
import { TabsNav, type ProfileTab } from "@/app/dashboard/members/[id]/tabs-nav";
import { AddCompetitionDialog } from "@/components/athlete/add-competition-dialog";
import { AddInjuryDialog } from "@/components/athlete/add-injury-dialog";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { BeltHistoryTimeline } from "@/components/athlete/belt-history-timeline";
import { CompetitionResults } from "@/components/athlete/competition-results";
import { InjuryList } from "@/components/athlete/injury-list";
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

const VALID_TABS: ProfileTab[] = ["overview", "training", "competition", "injuries"];

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const { id } = await params;
  const sp = await searchParams;
  const tab: ProfileTab = VALID_TABS.includes(sp.tab as ProfileTab)
    ? (sp.tab as ProfileTab)
    : "overview";

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
      weightClassKg: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!member) notFound();

  const [promotionsCount, competitionsCount, injuriesCount] = await Promise.all([
    prisma.beltPromotion.count({ where: { userId: member.id, gymId } }),
    prisma.competitionResult.count({ where: { userId: member.id, gymId } }),
    prisma.injury.count({ where: { userId: member.id, gymId } }),
  ]);

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
        description="Profile, rank, competition record, and injuries."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <ProfileSidebar member={member} />

        <div className="space-y-6">
          <TabsNav
            memberId={member.id}
            current={tab}
            counts={{
              training: promotionsCount,
              competition: competitionsCount,
              injuries: injuriesCount,
            }}
          />

          {tab === "overview" ? (
            <OverviewTab
              memberId={member.id}
              currentRole={member.role}
              currentBelt={member.belt}
              currentStripes={member.stripes}
              canChangeRole={canChangeRole}
              viewerRole={session.user.role}
            />
          ) : null}

          {tab === "training" ? (
            <TrainingTab memberId={member.id} gymId={gymId} />
          ) : null}

          {tab === "competition" ? (
            <CompetitionTab memberId={member.id} gymId={gymId} />
          ) : null}

          {tab === "injuries" ? (
            <InjuriesTab memberId={member.id} gymId={gymId} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileSidebar({
  member,
}: {
  member: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: "ADMIN" | "COACH" | "STUDENT";
    belt: "WHITE" | "BLUE" | "PURPLE" | "BROWN" | "BLACK" | null;
    stripes: number;
    weightClassKg: number | null;
    bio: string | null;
    createdAt: Date;
  };
}) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20">
          {member.image ? <AvatarImage src={member.image} alt={member.name ?? ""} /> : null}
          <AvatarFallback className="text-lg">
            {initialsFor(member.name, member.email)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-3 text-lg">{member.name ?? "Unnamed"}</CardTitle>
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
            <Scale className="mr-1.5 inline h-3.5 w-3.5" />
            Weight class
          </span>
          <span>{member.weightClassKg ? `${member.weightClassKg} kg` : "—"}</span>
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
        {member.bio ? (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{member.bio}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  memberId,
  currentRole,
  currentBelt,
  currentStripes,
  canChangeRole,
  viewerRole,
}: {
  memberId: string;
  currentRole: "ADMIN" | "COACH" | "STUDENT";
  currentBelt: "WHITE" | "BLUE" | "PURPLE" | "BROWN" | "BLACK" | null;
  currentStripes: number;
  canChangeRole: boolean;
  viewerRole: "ADMIN" | "COACH" | "STUDENT";
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Belt promotion</CardTitle>
          <CardDescription>
            One click to add a stripe, or pick a belt to promote directly. Every change writes
            to the training timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromoteBeltForm
            userId={memberId}
            currentBelt={currentBelt}
            currentStripes={currentStripes}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Role</CardTitle>
          <CardDescription>
            {canChangeRole
              ? "Admins can promote a coach or demote to student."
              : viewerRole !== "ADMIN"
              ? "Only admins can change roles."
              : "You cannot change your own role."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canChangeRole ? (
            <ChangeRoleForm userId={memberId} currentRole={currentRole} />
          ) : (
            <div className="flex items-center gap-3">
              <RoleBadge role={currentRole} />
              <span className="text-sm text-muted-foreground">Locked</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function TrainingTab({ memberId, gymId }: { memberId: string; gymId: string }) {
  const promotions = await prisma.beltPromotion.findMany({
    where: { userId: memberId, gymId },
    orderBy: { awardedAt: "desc" },
    include: {
      awardedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Training timeline</CardTitle>
        <CardDescription>
          Every belt and stripe awarded, with the awarding coach.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BeltHistoryTimeline promotions={promotions} />
      </CardContent>
    </Card>
  );
}

async function CompetitionTab({ memberId, gymId }: { memberId: string; gymId: string }) {
  const results = await prisma.competitionResult.findMany({
    where: { userId: memberId, gymId },
    orderBy: { competedAt: "desc" },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Competition record</CardTitle>
          <CardDescription>Events, brackets, and bracket-level W/L.</CardDescription>
        </div>
        <AddCompetitionDialog userId={memberId} />
      </CardHeader>
      <CardContent>
        <CompetitionResults userId={memberId} results={results} />
      </CardContent>
    </Card>
  );
}

async function InjuriesTab({ memberId, gymId }: { memberId: string; gymId: string }) {
  const injuries = await prisma.injury.findMany({
    where: { userId: memberId, gymId },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Injury log</CardTitle>
          <CardDescription>What hurts and what to avoid in sparring.</CardDescription>
        </div>
        <AddInjuryDialog userId={memberId} />
      </CardHeader>
      <CardContent>
        <InjuryList userId={memberId} injuries={injuries} />
      </CardContent>
    </Card>
  );
}
