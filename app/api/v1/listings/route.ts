import { API_STAFF, apiError, apiListingInput, checkApiKey, mergeToFormValues } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStaffListings } from "@/lib/db/queries";
import { fromRow, toRow } from "@/lib/db/rows";
import { buildListing } from "@/lib/records";
import { fieldErrors, listingFormSchema } from "@/lib/validation";
import type { Listing } from "@/types";
import { publicUrl, readJson, refreshPublicListings, slugTaken, uniqueSlug } from "./shared";

/** GET /api/v1/listings — every listing, including drafts and internal fields. */
export async function GET(req: Request) {
  const denied = checkApiKey(req);
  if (denied) return denied;
  const listings = await getStaffListings(API_STAFF);
  return Response.json({ ok: true, count: listings.length, listings });
}

/**
 * POST /api/v1/listings — create a listing. Body: the JSON fields in lib/api.ts.
 * `slug` defaults to the title; `published` defaults to true.
 */
export async function POST(req: Request) {
  const denied = checkApiKey(req);
  if (denied) return denied;

  const input = apiListingInput.safeParse(await readJson(req));
  if (!input.success) return apiError(400, "Invalid JSON body", fieldErrors(input.error));

  const values = mergeToFormValues(null, input.data);
  if (!values.slug) values.slug = await uniqueSlug(values.title);
  else if (await slugTaken(values.slug)) return apiError(409, "Another listing already uses this slug", { slug: "Already used" });

  const parsed = listingFormSchema.safeParse(values);
  if (!parsed.success) return apiError(422, "Listing didn't pass validation", fieldErrors(parsed.error));

  const listing = buildListing(parsed.data, null, input.data.published ?? true, API_STAFF);
  const { data, error } = await supabaseAdmin().from("listings").insert(toRow(listing)).select("*").single();
  if (error) {
    console.error("API create listing:", error.message);
    return apiError(500, "Couldn't save the listing");
  }
  const saved = fromRow<Listing>(data);
  if (saved.published) refreshPublicListings();
  return Response.json({ ok: true, listing: saved, url: publicUrl(req, saved) }, { status: 201 });
}
