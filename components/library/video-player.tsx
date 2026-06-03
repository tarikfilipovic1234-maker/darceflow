import { PlayCircle } from "lucide-react";

import { parseVideoUrl } from "@/lib/video";

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const parsed = parseVideoUrl(url);

  if (parsed.kind === "youtube" || parsed.kind === "vimeo") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-black">
        <iframe
          src={parsed.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (parsed.kind === "direct") {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
        <video
          src={parsed.src}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/40 text-center text-muted-foreground">
      <PlayCircle className="h-10 w-10" />
      <div>
        <p className="text-sm font-medium">External link</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline-offset-2 hover:underline"
        >
          Open in a new tab
        </a>
      </div>
    </div>
  );
}
