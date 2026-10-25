import type { z } from "zod";
import type { Listing, ServiceRequest, StaffSession, StudentEnquiry } from "@/types";
import {
  normalizePhone,
  type callbackFormSchema,
  type enquiryFormSchema,
  type listingFormSchema,
  type serviceFormSchema,
  type vacancyFormSchema,
} from "./validation";
import { makeId, makeReference, slugify } from "./utils";

/**
 * Turn validated form data into database records. Runs on the server, after the
 * same zod schema the browser used has been re-checked, so nothing the browser
 * sends is trusted for ids, statuses, timestamps or listing titles.
 */

type ListingRef = Pick<Listing, "id" | "title" | "locality"> | null;

function groupNumber(size: string, exact: string): number {
  return size === "5+" ? Number(exact) : Number(size);
}

export function buildEnquiry(data: z.output<typeof enquiryFormSchema>, listing: ListingRef): StudentEnquiry {
  const now = new Date().toISOString();
  const req = data.accommodationRequirement;
  return {
    id: makeReference("RH"),
    type: "property-enquiry",
    status: "new",
    listingId: listing?.id ?? null,
    listingTitleSnapshot: listing?.title ?? null,
    fullName: data.fullName.trim(),
    mobile: normalizePhone(data.mobile),
    email: data.email.trim() || null,
    whatsappPreferred: data.whatsappPreferred,
    yearOfStudy: data.yearOfStudy,
    accommodationRequirement: req,
    groupSize: groupNumber(data.groupSize, data.groupSizeExact),
    occupantsFor: data.occupantsFor,
    vacanciesNeeded: req === "vacant-room" ? Number(data.vacanciesNeeded) : null,
    preferredBedrooms: req === "full-flat" ? Number(data.preferredBedrooms) : null,
    wholeFlatTogether: req === "full-flat" ? data.wholeFlatTogether === "Yes" : null,
    sharedCommonAreasOk: req === "vacant-room" ? data.sharedCommonAreasOk === "Yes" : null,
    joiningWith: req === "vacant-room" ? data.joiningWith : null,
    pgSharing: req === "pg" ? data.pgSharing : null,
    mealsRequired: req === "pg" ? data.mealsRequired === "Yes" : null,
    budget: data.budget,
    preferredLocality: data.preferredLocality.trim(),
    moveInDate: data.moveInFlexible ? null : data.moveInDate,
    moveInFlexible: data.moveInFlexible,
    preferredCallbackTime: null,
    additionalRequirements: data.additionalRequirements.trim() || null,
    internalNote: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildCallback(data: z.output<typeof callbackFormSchema>, listing: ListingRef): StudentEnquiry {
  const now = new Date().toISOString();
  return {
    id: makeReference("CB"),
    type: "callback",
    status: "new",
    listingId: listing?.id ?? null,
    listingTitleSnapshot: listing?.title ?? null,
    fullName: data.fullName.trim(),
    mobile: normalizePhone(data.mobile),
    email: null,
    whatsappPreferred: data.whatsappPreferred,
    yearOfStudy: data.yearOfStudy,
    accommodationRequirement: data.accommodationRequirement,
    groupSize: groupNumber(data.groupSize, data.groupSizeExact),
    occupantsFor: null,
    vacanciesNeeded: null,
    preferredBedrooms: null,
    wholeFlatTogether: null,
    sharedCommonAreasOk: null,
    joiningWith: null,
    pgSharing: null,
    mealsRequired: null,
    budget: data.budget || "Not given",
    preferredLocality: listing?.locality ?? "Not given",
    moveInDate: data.moveInFlexible ? null : data.moveInDate,
    moveInFlexible: data.moveInFlexible,
    preferredCallbackTime: data.preferredCallbackTime,
    additionalRequirements: data.note.trim() || null,
    internalNote: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildServiceRequest(data: z.output<typeof serviceFormSchema>): ServiceRequest {
  const now = new Date().toISOString();
  return {
    id: makeReference("SR"),
    category: data.category,
    locality: data.locality.trim(),
    issue: data.issue.trim(),
    preferredDate: data.date,
    contactPreference: data.contactPreference,
    contact: data.contactPreference === "Email" ? data.contact.trim() : normalizePhone(data.contact),
    status: "new",
    internalNote: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildVacancyDraft(
  data: z.output<typeof vacancyFormSchema>,
  media: { images: string[]; videos: string[] },
  fallbackImage: string,
): { listing: Listing; ref: string } {
  const ref = makeReference("VC");
  const now = new Date().toISOString();
  const spots = Number(data.rooms);
  const flatmates = Number(data.flatmates);
  const title = `${data.accommodationType} vacancy in ${data.locality}`;
  const listing: Listing = {
    id: makeId("lst"),
    slug: slugify(`${title}-${ref}`),
    title,
    description: data.description.trim(),
    locality: data.locality,
    landmark: null,
    approxDistanceKm: null,
    accommodationType: data.accommodationType,
    furnishing: data.furnishing,
    sharingType: data.accommodationType === "Private Room" ? "Own room in a shared flat" : "Twin sharing",
    monthlyRent: Number(data.monthlyRent),
    deposit: data.deposit ? Number(data.deposit) : null,
    maintenance: null,
    otherCharges: null,
    pricingNotes: null,
    capacity: flatmates + spots,
    occupied: flatmates,
    availableFrom: data.availableFrom || null,
    bedrooms: null,
    bathrooms: null,
    amenities: data.amenities,
    houseRules: [],
    genderRestriction: data.genderRestriction || null,
    images: media.images.length ? media.images : [fallbackImage],
    videos: media.videos,
    ownerName: data.ownerName.trim(),
    ownerContact: [normalizePhone(data.phone), data.email.trim()].filter(Boolean).join(" / "),
    ownerIdentityChecked: false,
    listingDetailsReviewed: false,
    verificationNotes: `Vacancy submitted by a student (${ref}, ${data.yearOfStudy}). ${media.images.length} photo(s), ${media.videos.length} video(s). An agent needs to visit, verify and assign it before publishing.`,
    published: false,
    source: "public-vacancy",
    agentId: null,
    createdAt: now,
    updatedAt: now,
  };
  return { listing, ref };
}

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const str = (n: number | null) => (n == null ? "" : String(n));

/** The editable fields of a listing, in the string-based shape the listing form schema validates. */
export function listingToFormValues(l: Listing | null): z.input<typeof listingFormSchema> {
  return {
    title: l?.title ?? "",
    slug: l?.slug ?? "",
    description: l?.description ?? "",
    locality: l?.locality ?? "",
    landmark: l?.landmark ?? "",
    approxDistanceKm: str(l?.approxDistanceKm ?? null),
    accommodationType: (l?.accommodationType ?? "") as z.input<typeof listingFormSchema>["accommodationType"],
    furnishing: (l?.furnishing ?? "") as z.input<typeof listingFormSchema>["furnishing"],
    sharingType: l?.sharingType ?? "",
    monthlyRent: str(l?.monthlyRent ?? null),
    deposit: str(l?.deposit ?? null),
    maintenance: str(l?.maintenance ?? null),
    otherCharges: l?.otherCharges ?? "",
    pricingNotes: l?.pricingNotes ?? "",
    capacity: str(l?.capacity ?? null),
    occupied: str(l?.occupied ?? null),
    availableFrom: l?.availableFrom ?? "",
    bedrooms: str(l?.bedrooms ?? null),
    bathrooms: str(l?.bathrooms ?? null),
    amenities: l?.amenities ?? [],
    houseRules: (l?.houseRules ?? []).join("\n"),
    genderRestriction: l?.genderRestriction ?? "",
    images: l?.images ?? [],
    videos: l?.videos ?? [],
    ownerName: l?.ownerName ?? "",
    ownerContact: l?.ownerContact ?? "",
    ownerIdentityChecked: l?.ownerIdentityChecked ?? false,
    listingDetailsReviewed: l?.listingDetailsReviewed ?? false,
    verificationNotes: l?.verificationNotes ?? "",
  };
}

/**
 * Build the listing an admin or agent saved. Agents own what they create; only the
 * site admin can tick the verification checks, so an agent's save keeps whatever
 * the checks were before.
 */
export function buildListing(
  v: z.output<typeof listingFormSchema>,
  existing: Listing | null,
  published: boolean,
  staff: StaffSession,
): Listing {
  const isAdmin = staff.role === "admin";
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? makeId("lst"),
    slug: v.slug.trim(),
    title: v.title.trim(),
    description: v.description.trim(),
    locality: v.locality.trim(),
    landmark: v.landmark.trim() || null,
    approxDistanceKm: num(v.approxDistanceKm),
    accommodationType: v.accommodationType,
    furnishing: v.furnishing,
    sharingType: v.sharingType.trim(),
    monthlyRent: Number(v.monthlyRent),
    deposit: num(v.deposit),
    maintenance: num(v.maintenance),
    otherCharges: v.otherCharges.trim() || null,
    pricingNotes: v.pricingNotes.trim() || null,
    capacity: num(v.capacity),
    occupied: num(v.occupied),
    availableFrom: v.availableFrom || null,
    bedrooms: num(v.bedrooms),
    bathrooms: num(v.bathrooms),
    amenities: v.amenities,
    houseRules: v.houseRules.split("\n").map((r) => r.trim()).filter(Boolean),
    genderRestriction: v.genderRestriction || null,
    images: v.images,
    videos: v.videos,
    ownerName: v.ownerName.trim() || null,
    ownerContact: v.ownerContact.trim() || null,
    ownerIdentityChecked: isAdmin ? v.ownerIdentityChecked : existing?.ownerIdentityChecked ?? false,
    listingDetailsReviewed: isAdmin ? v.listingDetailsReviewed : existing?.listingDetailsReviewed ?? false,
    verificationNotes: v.verificationNotes.trim(),
    published,
    source: existing?.source ?? (isAdmin ? "admin" : "agent"),
    agentId: existing ? existing.agentId : staff.role === "agent" ? staff.id : null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
