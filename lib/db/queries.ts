import "server-only";
import { unstable_cache } from "next/cache";
import type { EnquiryFeedback, EnquiryWithFeedback, Listing, ServiceRequest, StaffAgent, StaffSession, StudentEnquiry } from "@/types";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { columns, fromRow } from "./rows";

export const LISTINGS_TAG = "listings";

/**
 * Everything a student may see. Landlord name/contact, verification notes and the
 * owning agent are never selected for public pages: every deal goes through REHLO.
 */
const PUBLIC_FIELDS = [
  "id", "slug", "title", "description", "locality", "landmark", "approxDistanceKm", "accommodationType",
  "furnishing", "sharingType", "monthlyRent", "deposit", "maintenance", "otherCharges", "pricingNotes",
  "capacity", "occupied", "availableFrom", "bedrooms", "bathrooms", "amenities", "houseRules",
  "genderRestriction", "images", "videos", "ownerIdentityChecked", "listingDetailsReviewed",
  "published", "source", "createdAt", "updatedAt",
] as const;

function publicListing(row: Record<string, unknown>): Listing {
  return { ...fromRow<Listing>(row), ownerName: null, ownerContact: null, verificationNotes: "", agentId: null };
}

/** Published listings, cached and refreshed whenever a staff action changes listings. */
export const getPublishedListings = unstable_cache(
  async (): Promise<Listing[]> => {
    if (!supabaseConfigured()) return [];
    const { data, error } = await supabaseAdmin()
      .from("listings")
      .select(columns(PUBLIC_FIELDS))
      .eq("published", true)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("getPublishedListings:", error.message);
      return [];
    }
    return (data as unknown as Record<string, unknown>[]).map(publicListing);
  },
  ["published-listings"],
  { tags: [LISTINGS_TAG], revalidate: 300 },
);

export async function getPublishedListing(slug: string): Promise<Listing | null> {
  return (await getPublishedListings()).find((l) => l.slug === slug) ?? null;
}

/* ---------------- staff only (callers must check requireStaff / requireAdmin first) ---------------- */

/** Admin sees every listing, including vacancy submissions; an agent sees only their own. */
export async function getStaffListings(staff: StaffSession): Promise<Listing[]> {
  let q = supabaseAdmin().from("listings").select("*").order("updated_at", { ascending: false });
  if (staff.role === "agent") q = q.eq("agent_id", staff.id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data.map((r) => fromRow<Listing>(r));
}

/** Every enquiry with its feedback history. Admins and agents both work all enquiries. */
export async function getEnquiries(): Promise<EnquiryWithFeedback[]> {
  const { data, error } = await supabaseAdmin()
    .from("enquiries")
    .select("*, enquiry_feedback(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((row) => {
    const { enquiry_feedback, ...rest } = row as Record<string, unknown> & { enquiry_feedback: Record<string, unknown>[] | null };
    const feedback = (enquiry_feedback ?? [])
      .map((f) => fromRow<EnquiryFeedback>(f))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { ...fromRow<StudentEnquiry>(rest), feedback };
  });
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabaseAdmin().from("service_requests").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((r) => fromRow<ServiceRequest>(r));
}

const AGENT_FIELDS = ["id", "username", "displayName", "active", "lastLoginAt", "createdAt", "updatedAt"] as const;

export async function getAgents(): Promise<StaffAgent[]> {
  const { data, error } = await supabaseAdmin().from("staff_agents").select(columns(AGENT_FIELDS)).order("created_at");
  if (error) throw new Error(error.message);
  return (data as unknown as Record<string, unknown>[]).map((r) => fromRow<StaffAgent>(r));
}
