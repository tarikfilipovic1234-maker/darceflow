export type VideoSource =
  | { kind: "youtube"; id: string; embedUrl: string; thumbnailUrl: string }
  | { kind: "vimeo"; id: string; embedUrl: string; thumbnailUrl: null }
  | { kind: "direct"; src: string; thumbnailUrl: null }
  | { kind: "unknown" };

const YT_ID = /(?:youtube\.com\/(?:[^/]+\/[^/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d{6,12})/;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(?:\?|$)/i;

export function parseVideoUrl(url: string | null | undefined): VideoSource {
  if (!url) return { kind: "unknown" };

  const ytMatch = url.match(YT_ID);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(VIMEO_ID);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      kind: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnailUrl: null,
    };
  }

  if (VIDEO_EXT.test(url)) {
    return { kind: "direct", src: url, thumbnailUrl: null };
  }

  return { kind: "unknown" };
}

export function autoThumbnail(url: string | null | undefined): string | null {
  const parsed = parseVideoUrl(url);
  if (parsed.kind === "youtube") return parsed.thumbnailUrl;
  return null;
}
