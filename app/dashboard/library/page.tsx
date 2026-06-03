import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LibraryBig, Plus } from "lucide-react";

import { LibraryFilterBar } from "@/app/dashboard/library/library-filter-bar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { TechniqueCard } from "@/components/library/technique-card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireGymId, requireSession } from "@/lib/db/scoped";
import type { Position, TechniqueCategory } from "@/lib/generated/prisma/enums";
import { CATEGORIES, POSITIONS } from "@/lib/validators/techniques";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Technique library" };

const PAGE_SIZE = 12;
const POSITION_SET = new Set<Position>(POSITIONS);
const CATEGORY_SET = new Set<TechniqueCategory>(CATEGORIES);

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    position?: string;
    category?: string;
    saved?: string;
    page?: string;
  }>;
}) {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const position = POSITION_SET.has(sp.position as Position)
    ? (sp.position as Position)
    : null;
  const category = CATEGORY_SET.has(sp.category as TechniqueCategory)
    ? (sp.category as TechniqueCategory)
    : null;
  const savedOnly = sp.saved === "1";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    gymId,
    ...(position ? { position } : {}),
    ...(category ? { category } : {}),
    ...(savedOnly
      ? { favorites: { some: { userId: session.user.id } } }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { tags: { has: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [techniques, total] = await Promise.all([
    prisma.technique.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        position: true,
        category: true,
        thumbnailUrl: true,
        durationSec: true,
        tags: true,
        _count: { select: { favorites: true } },
        favorites: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    }),
    prisma.technique.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!q || !!position || !!category || savedOnly;
  const canCreate = session.user.role !== "STUDENT";

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (position) params.set("position", position);
    if (category) params.set("category", category);
    if (savedOnly) params.set("saved", "1");
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `?${qs}` : ".";
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Technique library"
        description="The academy's playbook — every technique, every position."
        actions={
          canCreate ? (
            <Link
              href="/dashboard/library/new"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Plus className="h-4 w-4" />
              Add technique
            </Link>
          ) : null
        }
      />

      <div className="space-y-6">
        <LibraryFilterBar />

        {techniques.length === 0 ? (
          <EmptyState
            icon={LibraryBig}
            title={hasFilters ? "Nothing matches those filters" : "Library is empty"}
            description={
              hasFilters
                ? "Loosen the filters or clear the search."
                : canCreate
                ? "Upload your first technique to start building the academy's playbook."
                : "Once coaches add techniques, they'll land here."
            }
            action={
              canCreate ? (
                <Link
                  href="/dashboard/library/new"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Add technique
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techniques.map((t) => (
              <TechniqueCard
                key={t.id}
                technique={{
                  slug: t.slug,
                  title: t.title,
                  position: t.position,
                  category: t.category,
                  thumbnailUrl: t.thumbnailUrl,
                  durationSec: t.durationSec,
                  tags: t.tags,
                  favoritesCount: t._count.favorites,
                  isFavorited: t.favorites.length > 0,
                }}
              />
            ))}
          </div>
        )}

        {total > 0 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {skip + 1}–{Math.min(skip + techniques.length, total)} of {total}
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
              <span className="px-2 text-xs">
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
