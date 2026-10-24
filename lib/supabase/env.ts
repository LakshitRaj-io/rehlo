/** Public Supabase settings. Safe on both server and client. */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");

export const MEDIA_BUCKET = "listing-media";
