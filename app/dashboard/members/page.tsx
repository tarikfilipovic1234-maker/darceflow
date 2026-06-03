import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";

import { MembersFilterBar } from "@/app/dashboard/members/members-filter-bar";
import { BeltBadge } from "@/components/athlete/belt-badge";
import { RoleBadge } from "@/components/athlete/role-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import type { BeltRank, Role } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Members" };

const PAGE_SIZE = 20;

const ROLES = new Set<Role>(["ADMIN", "COACH", "STUDENT"]);
const BELTS = new Set<BeltRank>(["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"]);

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    belt?: string;
    page?: string;
  }>;
}) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const role = ROLES.has(sp.role as Role) ? (sp.role as Role) : null;
  const belt = BELTS.has(sp.belt as BeltRank) ? (sp.belt as BeltRank) : null;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    gymId,
    ...(role ? { role } : {}),
    ...(belt ? { belt } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip,
      take: PAGE_SIZE,
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
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!q || !!role || !!belt;

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (belt) params.set("belt", belt);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `?${qs}` : ".";
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Members"
        description="Every athlete, coach, and admin on the mats."
        actions={
          <Link
            href="/dashboard/members/new"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="h-4 w-4" />
            Invite member
          </Link>
        }
      />

      <div className="space-y-6">
        <MembersFilterBar />

        {members.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={hasFilters ? "No matches" : "Nobody on the mats yet"}
            description={
              hasFilters
                ? "Try clearing your filters."
                : "Invite your first coach or student to get rolling."
            }
            action={
              <Link
                href="/dashboard/members/new"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Invite member
              </Link>
            }
          />
        ) : (
          <div className="rounded-xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Belt</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {m.image ? <AvatarImage src={m.image} alt={m.name ?? ""} /> : null}
                          <AvatarFallback className="text-xs">
                            {initialsFor(m.name, m.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.name ?? "Unnamed"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.email ?? "no email"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={m.role} />
                    </TableCell>
                    <TableCell>
                      <BeltBadge belt={m.belt} stripes={m.stripes} size="sm" showLabel />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/members/${m.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                        )}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {total > 0 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {skip + 1}–{Math.min(skip + members.length, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <Link
                href={buildPageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1",
                  page <= 1 && "pointer-events-none opacity-50",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
              <span className="px-2 text-xs text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Link
                href={buildPageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1",
                  page >= totalPages && "pointer-events-none opacity-50",
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
