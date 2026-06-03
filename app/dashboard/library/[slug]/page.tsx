import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Heart, Trash2 } from "lucide-react";

import { deleteTechniqueAction } from "@/app/dashboard/library/actions";
import { FavoriteButton } from "@/components/library/favorite-button";
import { VideoPlayer } from "@/components/library/video-player";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireGymId, requireSession } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABEL, POSITION_LABEL } from "@/lib/validators/techniques";
import { cn } from "@/lib/utils";

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await prisma.technique.findFirst({
    where: { slug },
    select: { title: true },
  });
  return { title: t?.title ?? "Technique" };
}

export default async function TechniqueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const { slug } = await params;

  const technique = await prisma.technique.findUnique({
    where: { gymId_slug: { gymId, slug } },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, image: true } },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!technique) notFound();

  const canManage = session.user.role !== "STUDENT";
  const duration = formatDuration(technique.durationSec);
  const isFavorited = technique.favorites.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/dashboard/library"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <PageHeader
        title={technique.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{POSITION_LABEL[technique.position]}</Badge>
            <Badge variant="outline">{CATEGORY_LABEL[technique.category]}</Badge>
            {duration ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
            ) : null}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <FavoriteButton
              techniqueId={technique.id}
              initiallyFavorited={isFavorited}
            />
            {canManage ? (
              <form action={deleteTechniqueAction}>
                <input type="hidden" name="id" value={technique.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </form>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <VideoPlayer url={technique.videoUrl} title={technique.title} />

          {technique.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {technique.description}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {technique.tags.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {technique.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/dashboard/library?q=${encodeURIComponent(t)}`}
                      className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-foreground hover:bg-muted"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Saved by
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                {technique._count.favorites} member
                {technique._count.favorites === 1 ? "" : "s"}
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Uploaded
                </p>
                <p className="text-foreground">
                  {formatDate(technique.createdAt)}
                </p>
              </div>
              {technique.uploadedBy ? (
                <>
                  <Separator />
                  <Link
                    href={`/dashboard/members/${technique.uploadedBy.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="h-7 w-7">
                      {technique.uploadedBy.image ? (
                        <AvatarImage
                          src={technique.uploadedBy.image}
                          alt={technique.uploadedBy.name ?? ""}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initialsFor(
                          technique.uploadedBy.name,
                          technique.uploadedBy.email,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      by{" "}
                      <span className="font-medium">
                        {technique.uploadedBy.name ?? technique.uploadedBy.email}
                      </span>
                    </span>
                  </Link>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
