import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { checkMedia, extensionFor, isOwnMediaUrl, MEDIA_PUBLIC_PREFIX, publicMediaUrl, type MediaKind } from "@/lib/media";

export type UploadTicket = { ok: true; signedUrl: string; publicUrl: string } | { ok: false; error: string };

/**
 * Issue a one-off signed upload URL so the browser can send the file straight to
 * Supabase Storage. Large videos never pass through a Next.js function (which caps
 * request bodies), and the bucket itself enforces the size and type limits too.
 */
export async function createUploadTicket(folder: string, kind: MediaKind, contentType: string, size: number): Promise<UploadTicket> {
  const problem = checkMedia(kind, contentType, size);
  if (problem) return { ok: false, error: problem };
  const ext = extensionFor(contentType);
  if (!ext) return { ok: false, error: "Unsupported file type." };
  const month = new Date().toISOString().slice(0, 7);
  const path = `${folder}/${month}/${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("createSignedUploadUrl:", error?.message);
    return { ok: false, error: "Couldn't start the upload. Please try again." };
  }
  return { ok: true, signedUrl: data.signedUrl, publicUrl: publicMediaUrl(path) };
}

/** Best-effort removal of files that live in our bucket. */
export async function removeMedia(urls: string[]): Promise<void> {
  const paths = urls.filter((u) => isOwnMediaUrl(u)).map((u) => decodeURIComponent(u.slice(MEDIA_PUBLIC_PREFIX.length)));
  if (!paths.length) return;
  const { error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).remove(paths);
  if (error) console.error("removeMedia:", error.message);
}
