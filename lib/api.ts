import "server-only";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Listing, StaffSession } from "@/types";
import { ACCOMMODATION_TYPES, FURNISHING, GENDER_RESTRICTIONS } from "@/types";
import { listingToFormValues } from "./records";
import type { ListingFormValues } from "./validation";

/**
 * REST API for managing listings from scripts (see scripts/listings.mjs).
 *
 * Requests must send `Authorization: Bearer <LISTINGS_API_KEY>`. The key has full
 * admin rights over listings, so keep it server-side and out of git. Without the
 * env var the API is switched off.
 */
export const API_STAFF: StaffSession = { role: "admin", id: null, name: "Listings API", username: "api" };

export function apiError(status: number, message: string, errors?: Record<string, string>): Response {
  return Response.json({ ok: false, message, ...(errors ? { errors } : {}) }, { status });
}

/** Returns an error Response when the request isn't authorised, or null when it is. */
export function checkApiKey(req: Request): Response | null {
  const key = process.env.LISTINGS_API_KEY ?? "";
  if (key.length < 32) return apiError(503, "The listings API is disabled. Set LISTINGS_API_KEY (32+ characters) to enable it.");
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return apiError(401, "Missing or invalid API key.");
  return null;
}

const money = z.number().int().nonnegative();
const optionalCount = z.number().int().nonnegative().nullable().optional();

/**
 * Friendly JSON shape: real numbers and arrays instead of the form's strings. Every
 * field is optional here so the same schema serves create (merged onto an empty
 * listing) and PATCH (merged onto the existing one); the listing form schema then
 * enforces what's actually required.
 */
export const apiListingInput = z
  .object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    locality: z.string(),
    landmark: z.string().nullable(),
    approxDistanceKm: z.number().nonnegative().nullable(),
    accommodationType: z.enum(ACCOMMODATION_TYPES),
    furnishing: z.enum(FURNISHING),
    sharingType: z.string(),
    /** Per person, per month. Put the whole-flat rent in pricingNotes. */
    monthlyRent: money,
    deposit: money.nullable(),
    maintenance: money.nullable(),
    otherCharges: z.string().nullable(),
    pricingNotes: z.string().nullable(),
    capacity: optionalCount,
    occupied: optionalCount,
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable(),
    bedrooms: optionalCount,
    bathrooms: optionalCount,
    amenities: z.array(z.string()),
    houseRules: z.array(z.string()),
    genderRestriction: z.enum(GENDER_RESTRICTIONS).nullable(),
    images: z.array(z.string()),
    videos: z.array(z.string()),
    ownerName: z.string().nullable(),
    ownerContact: z.string().nullable(),
    ownerIdentityChecked: z.boolean(),
    listingDetailsReviewed: z.boolean(),
    verificationNotes: z.string(),
    /** A room or bed in an occupied flat; accommodationType must then be Shared Room or Private Room. */
    isVacancy: z.boolean(),
    published: z.boolean(),
  })
  .partial()
  .strict();

export type ApiListingInput = z.infer<typeof apiListingInput>;

/** Overlay API input onto a listing (or a blank one) and return form values for the shared validation. */
export function mergeToFormValues(base: Listing | null, input: ApiListingInput): ListingFormValues {
  const merged = { ...listingToFormValues(base) };
  const s = (v: number | null | undefined) => (v == null ? "" : String(v));
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || k === "published") continue;
    const key = k as keyof ListingFormValues;
    if (key === "houseRules") merged.houseRules = (v as string[]).join("\n");
    else if (typeof v === "number" || v === null) (merged as Record<string, unknown>)[key] = typeof merged[key] === "string" ? s(v as number | null) : v;
    else (merged as Record<string, unknown>)[key] = v;
  }
  return merged;
}
