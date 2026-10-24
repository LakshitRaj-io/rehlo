import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return SUPABASE_URL !== "" && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Service-role client. Bypasses RLS, so it must only ever run on the server, and
 * every caller is responsible for validating input and checking permissions first.
 */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  client = createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
