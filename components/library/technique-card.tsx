import Image from "next/image";
import Link from "next/link";
import { Heart, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Position, TechniqueCategory } from "@/lib/generated/prisma/enums";
import {
  CATEGORY_LABEL,
  POSITION_LABEL,
} from "@/lib/validators/techniques";
import { cn } from "@/lib/utils";

type CardTechnique = {
  slug: string;
  title: string;
  position: Position;
  category: TechniqueCategory;
  thumbnailUrl: string | null;
  durationSec: number | null;
  tags: string[];
  favoritesCount?: number;
  isFavorited?: boolean;
};

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TechniqueCard({ technique }: { technique: CardTechnique }) {
  const duration = formatDuration(technique.durationSec);
  return (
    <Link
      href={`/dashboard/library/${technique.slug}`}
      className="group block"
    >
      <Card className="overflow-hidden transition-colors group-hover:border-foreground/30">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {technique.thumbnailUrl ? (
            <Image
              src={technique.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <PlayCircle className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <Badge variant="outline" className="border-white/20 bg-black/55 text-xs text-white backdrop-blur">
              {CATEGORY_LABEL[technique.category]}
            </Badge>
            {duration ? (
              <Badge variant="outline" className="border-white/20 bg-black/55 font-mono text-xs text-white backdrop-blur">
                {duration}
              </Badge>
            ) : null}
          </div>
          {technique.isFavorited ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/20 px-1.5 py-0.5 text-xs text-rose-100 backdrop-blur">
              <Heart className="h-3 w-3 fill-current" />
              Saved
            </span>
          ) : null}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="line-clamp-1 text-sm font-medium">{technique.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5">
              {POSITION_LABEL[technique.position]}
            </span>
            {technique.tags.slice(0, 2).map((t) => (
              <span key={t} className={cn("text-muted-foreground")}>
                · {t}
              </span>
            ))}
            {typeof technique.favoritesCount === "number" && technique.favoritesCount > 0 ? (
              <span className="ml-auto inline-flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {technique.favoritesCount}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
