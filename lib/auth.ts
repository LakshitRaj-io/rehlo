import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { StaffSession } from "@/types";
import { supabaseAdmin } from "./supabase/admin";
import { verifyPassword } from "./password";

/**
 * Staff sign-in, verified on the server.
 *
 * - Site admin: username "admin" + the admin password, compared against a SHA-256
 *   hash (ADMIN_PASSWORD_HASH, server-only; falls back to the original default
 *   "rehlo@admin" so the existing login keeps working until you set one).
 * - Agents: accounts the admin creates, stored in staff_agents with scrypt hashes.
 *
 * A successful sign-in sets an httpOnly, HMAC-signed session cookie. Every staff
 * server action re-reads it, and agent sessions are re-checked against the database
 * so deactivating an agent signs them out immediately.
 * Five failed attempts from one IP within a minute lock that IP for 60 seconds.
 */
export const ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_HASH = "35fbbfb40b177217b71495d939e116d13b80f00d5ba731cff42453b2c2494320";
const COOKIE = "rehlo_staff";
const SESSION_HOURS = 8;
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

type Payload = { r: "admin" | "agent"; id: string | null; exp: number };

function adminHash(): string {
  return (process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_HASH).trim().toLowerCase();
}

export function usingDefaultAdminPassword(): boolean {
  return !process.env.ADMIN_PASSWORD_HASH;
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Set ADMIN_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) to sign staff sessions");
  return s;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function readPayload(value: string | undefined): Payload | null {
  if (!value) return null;
  const [data, sig] = value.split(".");
  if (!data || !sig) return null;
  try {
    if (!safeEqual(sig, sign(data))) return null;
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

/** The signed-in staff member, or null. Agents are re-checked against the database. */
export async function getStaff(): Promise<StaffSession | null> {
  const p = readPayload((await cookies()).get(COOKIE)?.value);
  if (!p) return null;
  if (p.r === "admin") return { role: "admin", id: null, name: "Site admin", username: ADMIN_USERNAME };
  if (!p.id) return null;
  const { data } = await supabaseAdmin()
    .from("staff_agents")
    .select("id, username, display_name, active")
    .eq("id", p.id)
    .maybeSingle();
  if (!data || !data.active) return null;
  return { role: "agent", id: data.id, name: data.display_name, username: data.username };
}

/** For staff server actions: any signed-in admin or agent. */
export async function requireStaff(): Promise<StaffSession> {
  const s = await getStaff();
  if (!s) throw new Error("Not signed in");
  return s;
}

/** For admin-only server actions. */
export async function requireAdmin(): Promise<StaffSession> {
  const s = await requireStaff();
  if (s.role !== "admin") throw new Error("Admins only");
  return s;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export type LoginResult = { ok: true } | { ok: false; reason: "locked" | "wrong" | "error"; remainingAttempts: number; lockSeconds: number };

async function setSession(payload: Payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // No maxAge: a browser-session cookie, so closing the browser signs out. The signed expiry caps it at 8 hours.
  });
}

export async function login(usernameRaw: string, password: string): Promise<LoginResult> {
  const username = usernameRaw.trim().toLowerCase();
  const ip = await clientIp();
  const db = supabaseAdmin();
  const since = new Date(Date.now() - LOCK_SECONDS * 1000).toISOString();
  const { data: recent, error } = await db
    .from("staff_login_attempts")
    .select("attempted_at")
    .eq("ip", ip)
    .gte("attempted_at", since)
    .order("attempted_at", { ascending: true });
  if (error) {
    console.error("login attempts:", error.message);
    return { ok: false, reason: "error", remainingAttempts: 0, lockSeconds: 0 };
  }

  const failures = recent ?? [];
  if (failures.length >= MAX_ATTEMPTS) {
    const oldest = new Date(failures[failures.length - MAX_ATTEMPTS].attempted_at).getTime();
    const lockSeconds = Math.max(1, Math.ceil((oldest + LOCK_SECONDS * 1000 - Date.now()) / 1000));
    return { ok: false, reason: "locked", remainingAttempts: 0, lockSeconds };
  }

  const exp = Date.now() + SESSION_HOURS * 3600_000;
  let ok = false;
  if (username === ADMIN_USERNAME) {
    ok = safeEqual(createHash("sha256").update(password).digest("hex"), adminHash());
    if (ok) await setSession({ r: "admin", id: null, exp });
  } else {
    const { data: agent } = await db
      .from("staff_agents")
      .select("id, password_hash, active")
      .eq("username", username)
      .maybeSingle();
    // Hash even for unknown users so response time doesn't reveal which usernames exist.
    const valid = await verifyPassword(password, agent?.password_hash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    ok = !!agent && agent.active && valid;
    if (ok && agent) {
      await setSession({ r: "agent", id: agent.id, exp });
      await db.from("staff_agents").update({ last_login_at: new Date().toISOString() }).eq("id", agent.id);
    }
  }

  if (ok) {
    await db.from("staff_login_attempts").delete().eq("ip", ip);
    return { ok: true };
  }

  await db.from("staff_login_attempts").insert({ ip, username: username.slice(0, 64) });
  const used = failures.length + 1;
  if (used >= MAX_ATTEMPTS) return { ok: false, reason: "locked", remainingAttempts: 0, lockSeconds: LOCK_SECONDS };
  return { ok: false, reason: "wrong", remainingAttempts: MAX_ATTEMPTS - used, lockSeconds: 0 };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
