import { MEDIA_BUCKET, SUPABASE_URL } from "./supabase/env";

/** Upload rules shared by the browser (early feedback) and the server (enforcement). */
export const MEDIA_RULES = {
  image: {
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    maxBytes: 10 * 1024 * 1024,
    accept: "image/jpeg,image/png,image/webp,image/avif",
    label: "JPG, PNG, WebP or AVIF up to 10 MB",
  },
  video: {
    types: ["video/mp4", "video/webm", "video/quicktime"],
    // Supabase Free plan caps a single upload at 50 MB. Raise with the bucket limit in supabase/schema.sql.
    maxBytes: 50 * 1024 * 1024,
    accept: "video/mp4,video/webm,video/quicktime",
    label: "MP4, WebM or MOV up to 50 MB",
  },
} as const;

export type MediaKind = keyof typeof MEDIA_RULES;

/** Local placeholder used when a listing has no photo yet. */
export const FALLBACK_IMAGE = "/images/fallback.svg";

export const MAX_IMAGES = 8;
export const MAX_VIDEOS = 3;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function extensionFor(contentType: string): string | null {
  return EXT[contentType] ?? null;
}

/** Returns an error message, or null when the file is acceptable. */
export function checkMedia(kind: MediaKind, contentType: string, size: number): string | null {
  const rule = MEDIA_RULES[kind];
  if (!(rule.types as readonly string[]).includes(contentType)) return `Use ${rule.label}.`;
  if (size <= 0) return "That file is empty.";
  if (size > rule.maxBytes) return `That file is too large. Use ${rule.label}.`;
  return null;
}

export const MEDIA_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;

export function publicMediaUrl(path: string): string {
  return `${MEDIA_PUBLIC_PREFIX}${path}`;
}

/** True for files that live in our bucket under the given folder (e.g. "owner-submissions/"). */
export function isOwnMediaUrl(url: string, folder = ""): boolean {
  return SUPABASE_URL !== "" && url.startsWith(MEDIA_PUBLIC_PREFIX + folder) && !url.includes("..");
}

export function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
