import { API_STAFF, apiError, apiListingInput, checkApiKey, mergeToFormValues } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fromRow, toRow } from "@/lib/db/rows";
import { removeMedia } from "@/lib/db/uploads";
import { buildListing } from "@/lib/records";
import { fieldErrors, listingFormSchema } from "@/lib/validation";
import type { Listing } from "@/types";
import { loadListing, publicUrl, readJson, refreshPublicListings, slugTaken } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/listings/:id */
export async function GET(req: Request, { params }: Ctx) {
  const denied = checkApiKey(req);
  if (denied) return denied;
  const listing = await loadListing((await params).id);
  return listing ? Response.json({ ok: true, listing, url: publicUrl(req, listing) }) : apiError(404, "No listing with that id");
}

/** PATCH /api/v1/listings/:id — update only the fields you send (e.g. {"published": false}). */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = checkApiKey(req);
  if (denied) return denied;
  const existing = await loadListing((await params).id);
  if (!existing) return apiError(404, "No listing with that id");

  const input = apiListingInput.safeParse(await readJson(req));
  if (!input.success) return apiError(400, "Invalid JSON body", fieldErrors(input.error));

  const values = mergeToFormValues(existing, input.data);
  if (values.slug !== existing.slug && (await slugTaken(values.slug, existing.id))) {
    return apiError(409, "Another listing already uses this slug", { slug: "Already used" });
  }
  const parsed = listingFormSchema.safeParse(values);
  if (!parsed.success) return apiError(422, "Listing didn't pass validation", fieldErrors(parsed.error));

  const listing = buildListing(parsed.data, existing, input.data.published ?? existing.published, API_STAFF);
  const { data, error } = await supabaseAdmin().from("listings").update(toRow(listing)).eq("id", existing.id).select("*").single();
  if (error) {
    console.error("API update listing:", error.message);
    return apiError(500, "Couldn't save the listing");
  }
  const saved = fromRow<Listing>(data);
  refreshPublicListings();
  return Response.json({ ok: true, listing: saved, url: publicUrl(req, saved) });
}

/** DELETE /api/v1/listings/:id — also removes its uploaded photos and videos. */
export async function DELETE(req: Request, { params }: Ctx) {
  const denied = checkApiKey(req);
  if (denied) return denied;
  const existing = await loadListing((await params).id);
  if (!existing) return apiError(404, "No listing with that id");
  const { error } = await supabaseAdmin().from("listings").delete().eq("id", existing.id);
  if (error) {
    console.error("API delete listing:", error.message);
    return apiError(500, "Couldn't delete the listing");
  }
  await removeMedia([...existing.images, ...existing.videos]);
  refreshPublicListings();
  return Response.json({ ok: true });
}
