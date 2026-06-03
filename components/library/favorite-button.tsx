"use client";

import { useOptimistic, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";

import { toggleFavoriteAction } from "@/app/dashboard/library/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  techniqueId,
  initiallyFavorited,
  size = "sm",
}: {
  techniqueId: string;
  initiallyFavorited: boolean;
  size?: "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, applyOptimistic] = useOptimistic(
    initiallyFavorited,
    (_current, next: boolean) => next,
  );

  function toggle() {
    startTransition(async () => {
      applyOptimistic(!favorited);
      const fd = new FormData();
      fd.set("techniqueId", techniqueId);
      await toggleFavoriteAction(fd);
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={favorited ? "outline" : "ghost"}
      onClick={toggle}
      disabled={pending}
      className={cn(
        "gap-1.5",
        favorited &&
          "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200",
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Heart
          className={cn("h-3.5 w-3.5", favorited && "fill-current")}
        />
      )}
      {favorited ? "Saved" : "Save"}
    </Button>
  );
}
