import "server-only";
import { revalidateTag } from "next/cache";
import type { Listing } from "@/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LISTINGS_TAG } from "@/lib/db/queries";
import { fromRow } from "@/lib/db/rows";
import { slugify } from "@/lib/utils";

export async function loadListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabaseAdmin().from("listings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow<Listing>(data) : null;
}

export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const { data } = await supabaseAdmin().from("listings").select("id").eq("slug", slug).neq("id", exceptId ?? "").maybeSingle();
  return !!data;
}

/** slugify(title), with -2, -3… appended until it's free. */
export async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "listing";
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    if (!(await slugTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Route handlers can't use updateTag; expire: 0 makes the next public request fetch fresh data. */
export function refreshPublicListings() {
  revalidateTag(LISTINGS_TAG, { expire: 0 });
}

export function publicUrl(req: Request, l: Listing): string | null {
  return l.published ? `${new URL(req.url).origin}/stay/${l.slug}` : null;
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
