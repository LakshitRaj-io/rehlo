"use server";

import { updateTag } from "next/cache";
import type { EnquiryFeedback, EnquiryStatus, Listing, ServiceRequest, StaffAgent, StaffSession, StudentEnquiry } from "@/types";
import { login, logout, requireAdmin, requireStaff, type LoginResult } from "@/lib/auth";
import { hashPassword, passwordProblem } from "@/lib/password";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LISTINGS_TAG } from "@/lib/db/queries";
import { fromRow, toRow } from "@/lib/db/rows";
import { createUploadTicket, removeMedia, type UploadTicket } from "@/lib/db/uploads";
import { buildListing } from "@/lib/records";
import type { MediaKind } from "@/lib/media";
import { agentFormSchema, feedbackSchema, fieldErrors, listingFormSchema, type AgentFormValues, type ListingFormValues } from "@/lib/validation";

/**
 * Staff actions. Server actions are reachable by direct POST, so every one starts
 * with requireStaff() or requireAdmin(), and agent actions re-check ownership.
 *
 *   admin: everything.
 *   agent: create / edit / publish / delete their OWN listings; read every enquiry,
 *          change its status and add feedback. No verification ticks, no deleting
 *          enquiries, no staff management, no other agents' listings.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string>; message?: string };

function fail(message: string, error?: { message: string } | null): { ok: false; errors: Record<string, string>; message: string } {
  if (error) console.error(`${message}:`, error.message);
  return { ok: false, errors: {}, message };
}

/* ---------------- session ---------------- */

export async function staffLogin(username: string, password: string): Promise<LoginResult> {
  if (typeof username !== "string" || typeof password !== "string" || !username || !password || username.length > 64 || password.length > 200) {
    return { ok: false, reason: "wrong", remainingAttempts: 0, lockSeconds: 0 };
  }
  return login(username, password);
}

export async function staffLogout(): Promise<void> {
  await logout();
}

/* ---------------- listings ---------------- */

async function loadListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabaseAdmin().from("listings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow<Listing>(data) : null;
}

/** Agents may only touch listings assigned to them. */
function canEdit(staff: StaffSession, l: Listing): boolean {
  return staff.role === "admin" || (l.agentId !== null && l.agentId === staff.id);
}

export async function saveListing(values: ListingFormValues, id: string | null, published: boolean): Promise<ActionResult<Listing>> {
  const staff = await requireStaff();
  const parsed = listingFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const db = supabaseAdmin();

  let existing: Listing | null = null;
  if (id) {
    existing = await loadListing(id);
    if (!existing) return fail("That listing no longer exists.");
    if (!canEdit(staff, existing)) return fail("You can only edit listings assigned to you.");
  }

  const { data: clash } = await db.from("listings").select("id").eq("slug", parsed.data.slug.trim()).neq("id", id ?? "").maybeSingle();
  if (clash) return { ok: false, errors: { slug: "Another listing already uses this slug" } };

  const listing = buildListing(parsed.data, existing, published, staff);
  const { data, error } = await db.from("listings").upsert(toRow(listing)).select("*").single();
  if (error) return fail("Couldn't save the listing", error);
  updateTag(LISTINGS_TAG);
  return { ok: true, data: fromRow<Listing>(data) };
}

export async function setListingPublished(id: string, published: boolean): Promise<ActionResult<Listing>> {
  const staff = await requireStaff();
  const existing = await loadListing(id);
  if (!existing) return fail("That listing no longer exists.");
  if (!canEdit(staff, existing)) return fail("You can only change listings assigned to you.");
  const { data, error } = await supabaseAdmin()
    .from("listings")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail("Couldn't change the listing", error);
  updateTag(LISTINGS_TAG);
  return { ok: true, data: fromRow<Listing>(data) };
}

/** Admin only: hand a listing (for example a student's vacancy) to an agent, or take it back (null). */
export async function assignListing(id: string, agentId: string | null): Promise<ActionResult<Listing>> {
  await requireAdmin();
  const db = supabaseAdmin();
  if (agentId) {
    const { data: agent } = await db.from("staff_agents").select("id").eq("id", agentId).maybeSingle();
    if (!agent) return fail("That agent doesn't exist.");
  }
  const { data, error } = await db
    .from("listings")
    .update({ agent_id: agentId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail("Couldn't assign the listing", error);
  return { ok: true, data: fromRow<Listing>(data) };
}

/** Deletes the listing and its uploaded files. Enquiries keep their title snapshot (listing_id becomes null). */
export async function deleteListing(id: string): Promise<ActionResult<null>> {
  const staff = await requireStaff();
  const existing = await loadListing(id);
  if (!existing) return { ok: true, data: null };
  if (!canEdit(staff, existing)) return fail("You can only delete listings assigned to you.");
  const { error } = await supabaseAdmin().from("listings").delete().eq("id", id);
  if (error) return fail("Couldn't delete the listing", error);
  await removeMedia([...existing.images, ...existing.videos]);
  updateTag(LISTINGS_TAG);
  return { ok: true, data: null };
}

export async function createStaffUpload(kind: MediaKind, contentType: string, size: number): Promise<UploadTicket> {
  await requireStaff();
  return createUploadTicket("listings", kind, contentType, size);
}

/* ---------------- enquiries ---------------- */

const STATUSES: EnquiryStatus[] = ["new", "contacted", "follow-up", "closed"];

/** Change status and record what the student said. Both admin and agents can do this on any enquiry. */
export async function addEnquiryFeedback(
  enquiryId: string,
  input: { status: EnquiryStatus; body: string },
): Promise<ActionResult<{ enquiry: StudentEnquiry; feedback: EnquiryFeedback }>> {
  const staff = await requireStaff();
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const db = supabaseAdmin();

  const { data: fb, error: fbError } = await db
    .from("enquiry_feedback")
    .insert({ enquiry_id: enquiryId, author_id: staff.id, author_name: staff.name, status: parsed.data.status, body: parsed.data.body })
    .select("*")
    .single();
  if (fbError) return fail("Couldn't save the feedback", fbError);

  const { data, error } = await db
    .from("enquiries")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", enquiryId)
    .select("*")
    .single();
  if (error) return fail("Couldn't update the enquiry", error);
  return { ok: true, data: { enquiry: fromRow<StudentEnquiry>(data), feedback: fromRow<EnquiryFeedback>(fb) } };
}

/** Quick status change without a note (e.g. reopening). */
export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<ActionResult<StudentEnquiry>> {
  await requireStaff();
  if (!STATUSES.includes(status)) return fail("Invalid status");
  const { data, error } = await supabaseAdmin()
    .from("enquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail("Couldn't update the enquiry", error);
  return { ok: true, data: fromRow<StudentEnquiry>(data) };
}

export async function deleteEnquiry(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("enquiries").delete().eq("id", id);
  if (error) return fail("Couldn't delete the enquiry", error);
  return { ok: true, data: null };
}

/* ---------------- service requests (admin) ---------------- */

export async function updateServiceRequest(id: string, patch: { status?: EnquiryStatus; internalNote?: string }): Promise<ActionResult<ServiceRequest>> {
  await requireAdmin();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) {
    if (!STATUSES.includes(patch.status)) return fail("Invalid status");
    row.status = patch.status;
  }
  if (patch.internalNote !== undefined) row.internal_note = String(patch.internalNote).slice(0, 2000);
  const { data, error } = await supabaseAdmin().from("service_requests").update(row).eq("id", id).select("*").single();
  if (error) return fail("Couldn't update the request", error);
  return { ok: true, data: fromRow<ServiceRequest>(data) };
}

export async function deleteServiceRequest(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("service_requests").delete().eq("id", id);
  if (error) return fail("Couldn't delete the request", error);
  return { ok: true, data: null };
}

/* ---------------- agents (admin) ---------------- */

const AGENT_COLUMNS = "id, username, display_name, active, last_login_at, created_at, updated_at";

export async function createAgent(values: AgentFormValues): Promise<ActionResult<StaffAgent>> {
  await requireAdmin();
  const parsed = agentFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const weak = passwordProblem(parsed.data.password);
  if (weak) return { ok: false, errors: { password: weak } };

  const { data, error } = await supabaseAdmin()
    .from("staff_agents")
    .insert({
      username: parsed.data.username,
      display_name: parsed.data.displayName,
      password_hash: await hashPassword(parsed.data.password),
    })
    .select(AGENT_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, errors: { username: "That username is taken" } };
    return fail("Couldn't create the agent", error);
  }
  return { ok: true, data: fromRow<StaffAgent>(data) };
}

export async function updateAgent(id: string, patch: { displayName?: string; active?: boolean; password?: string }): Promise<ActionResult<StaffAgent>> {
  await requireAdmin();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) {
    const name = String(patch.displayName).trim();
    if (name.length < 2 || name.length > 60) return { ok: false, errors: { displayName: "Use 2–60 characters" } };
    row.display_name = name;
  }
  if (patch.active !== undefined) row.active = !!patch.active;
  if (patch.password !== undefined) {
    const weak = passwordProblem(String(patch.password));
    if (weak) return { ok: false, errors: { password: weak } };
    row.password_hash = await hashPassword(String(patch.password));
  }
  const { data, error } = await supabaseAdmin().from("staff_agents").update(row).eq("id", id).select(AGENT_COLUMNS).single();
  if (error) return fail("Couldn't update the agent", error);
  return { ok: true, data: fromRow<StaffAgent>(data) };
}

/** Removes the account. Their listings stay (unassigned) and feedback keeps the author's name. */
export async function deleteAgent(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("staff_agents").delete().eq("id", id);
  if (error) return fail("Couldn't remove the agent", error);
  return { ok: true, data: null };
}
