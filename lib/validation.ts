import { z } from "zod";
import { ACCOMMODATION_TYPES, FURNISHING, GENDER_RESTRICTIONS } from "@/types";
import { isValidHttpUrl } from "./utils";
import { isOwnMediaUrl, MAX_IMAGES, MAX_VIDEOS } from "./media";

/* ---------------- shared ---------------- */

export function normalizePhone(v: string): string {
  return v.replace(/[\s\-().]/g, "");
}

/** Indian mobile (10 digits starting 6–9, optional 0 / 91 / +91) or any international number with a + prefix. */
export function isValidPhone(v: string): boolean {
  const n = normalizePhone(v);
  if (/^\+91[6-9]\d{9}$/.test(n)) return true;
  if (/^\+(?!91)\d{8,15}$/.test(n)) return true;
  return /^(?:0|91)?[6-9]\d{9}$/.test(n);
}

const phone = z
  .string()
  .trim()
  .min(1, "Enter a mobile number")
  .refine(isValidPhone, "Enter a 10-digit Indian mobile number, or an international number starting with +");

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email, or leave it blank");

const name = z.string().trim().min(2, "Enter your full name").max(80, "Keep the name under 80 characters");

/** Turns a zod error into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ---------------- student enquiry ---------------- */

export const REQUIREMENT_OPTIONS = [
  { value: "full-flat", label: "Full flat for my group" },
  { value: "vacant-room", label: "A vacant room in an existing flat" },
  { value: "private-room", label: "A private room" },
  { value: "shared-room", label: "Shared room" },
  { value: "pg", label: "PG accommodation" },
  { value: "hostel", label: "Hostel accommodation" },
  { value: "flexible", label: "Open to options" },
] as const;

export const CALLBACK_REQUIREMENT_OPTIONS = [
  { value: "full-flat", label: "Full flat for a group" },
  { value: "vacant-room", label: "Vacancy in an existing flat" },
  { value: "private-room", label: "Private room" },
  { value: "shared-room", label: "Shared room" },
  { value: "pg-hostel", label: "PG or hostel" },
] as const;

export const REQUIREMENT_LABELS: Record<string, string> = {
  "full-flat": "Full flat for a group",
  "vacant-room": "Vacant room in an existing flat",
  "private-room": "Private room",
  "shared-room": "Shared room",
  pg: "PG accommodation",
  hostel: "Hostel accommodation",
  "pg-hostel": "PG or hostel",
  flexible: "Open to options",
};

export const GROUP_SIZE_OPTIONS = ["1", "2", "3", "4", "5+"] as const;
export const OCCUPANTS_FOR = ["Just me", "Me and friends", "A group looking for an entire flat", "Still deciding"] as const;
export const CALLBACK_TIMES = ["Morning", "Afternoon", "Evening", "Any time"] as const;

const moveIn = {
  moveInFlexible: z.boolean(),
  moveInDate: z.string(),
};

function checkMoveIn(v: { moveInFlexible: boolean; moveInDate: string }, ctx: z.RefinementCtx) {
  if (!v.moveInFlexible && !v.moveInDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["moveInDate"], message: "Pick a date, or choose Flexible" });
  }
}

function checkGroup(v: { groupSize: string; groupSizeExact: string }, ctx: z.RefinementCtx) {
  if (v.groupSize === "5+") {
    const n = Number(v.groupSizeExact);
    if (!Number.isInteger(n) || n < 5 || n > 30) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["groupSizeExact"], message: "Enter how many people (5–30)" });
    }
  }
}

export const enquiryFormSchema = z
  .object({
    fullName: name,
    mobile: phone,
    whatsappPreferred: z.boolean(),
    email: optionalEmail,
    yearOfStudy: z.string().min(1, "Choose your year of study"),
    accommodationRequirement: z.enum(["full-flat", "vacant-room", "private-room", "shared-room", "pg", "hostel", "flexible"], {
      errorMap: () => ({ message: "Choose what you're looking for" }),
    }),
    groupSize: z.enum(GROUP_SIZE_OPTIONS, { errorMap: () => ({ message: "Choose how many people" }) }),
    groupSizeExact: z.string(),
    occupantsFor: z.string().min(1, "Choose who this is for"),
    preferredBedrooms: z.string(),
    wholeFlatTogether: z.string(),
    vacanciesNeeded: z.string(),
    sharedCommonAreasOk: z.string(),
    joiningWith: z.string(),
    pgSharing: z.string(),
    mealsRequired: z.string(),
    budget: z.string().min(1, "Choose a budget"),
    preferredLocality: z.string().trim().min(1, "Choose or type a locality"),
    additionalRequirements: z.string().max(500, "Keep this under 500 characters"),
    ...moveIn,
  })
  .superRefine((v, ctx) => {
    checkMoveIn(v, ctx);
    checkGroup(v, ctx);
    if (v.accommodationRequirement === "full-flat") {
      if (!v.preferredBedrooms) ctx.addIssue({ code: "custom", path: ["preferredBedrooms"], message: "Choose a number of bedrooms" });
      if (!v.wholeFlatTogether) ctx.addIssue({ code: "custom", path: ["wholeFlatTogether"], message: "Choose one" });
    }
    if (v.accommodationRequirement === "vacant-room") {
      if (!v.vacanciesNeeded) ctx.addIssue({ code: "custom", path: ["vacanciesNeeded"], message: "Choose how many vacancies" });
      if (!v.sharedCommonAreasOk) ctx.addIssue({ code: "custom", path: ["sharedCommonAreasOk"], message: "Choose one" });
      if (!v.joiningWith) ctx.addIssue({ code: "custom", path: ["joiningWith"], message: "Choose one" });
    }
    if (v.accommodationRequirement === "pg") {
      if (!v.pgSharing) ctx.addIssue({ code: "custom", path: ["pgSharing"], message: "Choose a sharing arrangement" });
      if (!v.mealsRequired) ctx.addIssue({ code: "custom", path: ["mealsRequired"], message: "Choose one" });
    }
  });

export type EnquiryFormValues = z.input<typeof enquiryFormSchema>;

export const callbackFormSchema = z
  .object({
    fullName: name,
    mobile: phone,
    yearOfStudy: z.string().min(1, "Choose your year of study"),
    groupSize: z.enum(GROUP_SIZE_OPTIONS, { errorMap: () => ({ message: "Choose how many people" }) }),
    groupSizeExact: z.string(),
    accommodationRequirement: z.enum(["full-flat", "vacant-room", "private-room", "shared-room", "pg-hostel"], {
      errorMap: () => ({ message: "Choose a requirement" }),
    }),
    preferredCallbackTime: z.enum(CALLBACK_TIMES, { errorMap: () => ({ message: "Choose a time" }) }),
    budget: z.string(),
    whatsappPreferred: z.boolean(),
    note: z.string().max(300, "Keep the note under 300 characters"),
    ...moveIn,
  })
  .superRefine((v, ctx) => {
    checkMoveIn(v, ctx);
    checkGroup(v, ctx);
  });

export type CallbackFormValues = z.input<typeof callbackFormSchema>;

/* ---------------- admin listing ---------------- */

const optNum = (label: string, max = 10_000_000) =>
  z.string().refine((v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= max), `${label} must be a positive number`);

export const listingFormSchema = z
  .object({
    title: z.string().trim().min(4, "Give the listing a title (4+ characters)").max(90, "Keep the title under 90 characters"),
    slug: z.string().trim().min(3, "Slug needs 3+ characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
    description: z.string().trim().min(20, "Describe the place in at least 20 characters").max(1200, "Keep the description under 1,200 characters"),
    locality: z.string().trim().min(1, "Choose a locality"),
    landmark: z.string().max(120),
    approxDistanceKm: optNum("Distance", 100),
    accommodationType: z.enum(ACCOMMODATION_TYPES, { errorMap: () => ({ message: "Choose a type" }) }),
    furnishing: z.enum(FURNISHING, { errorMap: () => ({ message: "Choose furnishing" }) }),
    sharingType: z.string().trim().min(2, "Describe the sharing arrangement"),
    monthlyRent: z.string().refine((v) => Number(v) >= 500 && Number(v) <= 200000, "Rent must be between ₹500 and ₹2,00,000"),
    deposit: optNum("Deposit"),
    maintenance: optNum("Maintenance"),
    otherCharges: z.string().max(200),
    pricingNotes: z.string().max(300),
    capacity: optNum("Capacity", 1000),
    occupied: optNum("Occupied spaces", 1000),
    availableFrom: z.string(),
    bedrooms: optNum("Bedrooms", 200),
    bathrooms: optNum("Bathrooms", 200),
    amenities: z.array(z.string()),
    houseRules: z.string().max(800),
    genderRestriction: z.union([z.enum(GENDER_RESTRICTIONS), z.literal("")]),
    images: z.array(z.string()).min(1, "Add at least one photo").max(MAX_IMAGES, `Use up to ${MAX_IMAGES} photos`),
    videos: z.array(z.string().refine((u) => isOwnMediaUrl(u), "Upload videos here rather than pasting links")).max(MAX_VIDEOS, `Use up to ${MAX_VIDEOS} videos`),
    ownerName: z.string().max(80),
    ownerContact: z.string().max(120),
    ownerIdentityChecked: z.boolean(),
    listingDetailsReviewed: z.boolean(),
    verificationNotes: z.string().max(800),
  })
  .superRefine((v, ctx) => {
    const cap = v.capacity.trim() === "" ? null : Number(v.capacity);
    const occ = v.occupied.trim() === "" ? null : Number(v.occupied);
    if (occ != null && cap == null) ctx.addIssue({ code: "custom", path: ["capacity"], message: "Add total capacity to track occupancy" });
    if (cap != null && occ != null && occ > cap) ctx.addIssue({ code: "custom", path: ["occupied"], message: "Occupied spaces can't exceed capacity" });
    if ([cap, occ].some((n) => n != null && !Number.isInteger(n))) ctx.addIssue({ code: "custom", path: ["capacity"], message: "Use whole numbers for capacity" });
    v.images.forEach((img) => {
      if (!isValidHttpUrl(img)) ctx.addIssue({ code: "custom", path: ["images"], message: `Not a valid image URL: ${img.slice(0, 40)}` });
    });
  });

export type ListingFormValues = z.input<typeof listingFormSchema>;

/* ---------------- public vacancy submission ---------------- */

/**
 * The only thing the public can post: a room or bed free in a flat they already
 * live in. Whole flats, PGs and hostels are listed by REHLO staff only.
 */
export const VACANCY_TYPES = ["Shared Room", "Private Room"] as const;
export const VACANCY_MEDIA_FOLDER = "vacancy-submissions/";

export const vacancyFormSchema = z
  .object({
    ownerName: name,
    phone,
    email: optionalEmail,
    yearOfStudy: z.string().min(1, "Choose your year of study"),
    locality: z.string().trim().min(1, "Choose the flat's locality"),
    accommodationType: z.enum(VACANCY_TYPES, { errorMap: () => ({ message: "Choose shared or private room" }) }),
    rooms: z.string().refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 10, "Enter between 1 and 10 spots"),
    flatmates: z.string().refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 20, "Enter between 0 and 20"),
    monthlyRent: z.string().refine((v) => Number(v) >= 500 && Number(v) <= 200000, "Rent must be between ₹500 and ₹2,00,000"),
    deposit: optNum("Deposit"),
    furnishing: z.enum(FURNISHING, { errorMap: () => ({ message: "Choose furnishing" }) }),
    availableFrom: z.string(),
    genderRestriction: z.union([z.enum(GENDER_RESTRICTIONS), z.literal("")]),
    amenities: z.array(z.string()),
    description: z.string().trim().min(20, "Describe the room and flat in at least 20 characters").max(800, "Keep it under 800 characters"),
    acknowledge: z.literal(true, { errorMap: () => ({ message: "Please confirm you understand the review process" }) }),
  });

/** Photos and videos uploaded with a vacancy. Only files in our own bucket's vacancy folder are accepted. */
export const vacancyMediaSchema = z.object({
  images: z.array(z.string().refine((u) => isOwnMediaUrl(u, VACANCY_MEDIA_FOLDER), "Invalid photo")).max(MAX_IMAGES),
  videos: z.array(z.string().refine((u) => isOwnMediaUrl(u, VACANCY_MEDIA_FOLDER), "Invalid video")).max(MAX_VIDEOS),
});

export type VacancyFormValues = z.input<typeof vacancyFormSchema>;

/* ---------------- staff accounts ---------------- */

export const agentFormSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, "3–32 characters: lowercase letters, numbers, dot, dash or underscore")
    .refine((v) => v !== "admin", "That username is reserved"),
  displayName: z.string().trim().min(2, "Enter the agent's name").max(60, "Keep it under 60 characters"),
  password: z.string(),
});

export type AgentFormValues = z.input<typeof agentFormSchema>;

/** Status change plus what the student said, recorded each time staff follow up. */
export const feedbackSchema = z.object({
  status: z.enum(["new", "contacted", "follow-up", "closed"]),
  body: z.string().trim().min(3, "Add a short note about the response").max(1000, "Keep it under 1,000 characters"),
});

/* ---------------- services ---------------- */

export const serviceFormSchema = z
  .object({
    category: z.string().min(1, "Choose a service"),
    locality: z.string().trim().min(1, "Choose your locality"),
    issue: z.string().trim().min(10, "Describe the issue in at least 10 characters").max(500, "Keep it under 500 characters"),
    date: z.string().min(1, "Pick a preferred date"),
    contactPreference: z.enum(["Phone call", "WhatsApp", "Email"], { errorMap: () => ({ message: "Choose how to be contacted" }) }),
    contact: z.string().trim().min(1, "Enter a phone number or email"),
  })
  .superRefine((v, ctx) => {
    if (v.contactPreference === "Email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact)) ctx.addIssue({ code: "custom", path: ["contact"], message: "Enter a valid email" });
    } else if (!isValidPhone(v.contact)) {
      ctx.addIssue({ code: "custom", path: ["contact"], message: "Enter a valid mobile number" });
    }
  });

export type ServiceFormValues = z.input<typeof serviceFormSchema>;
