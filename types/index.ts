export const ACCOMMODATION_TYPES = ["PG", "Shared Room", "Private Room", "Flat", "Hostel"] as const;
export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

export const FURNISHING = ["Furnished", "Semi-furnished", "Unfurnished"] as const;
export type Furnishing = (typeof FURNISHING)[number];

export const GENDER_RESTRICTIONS = ["Women only", "Men only", "Any"] as const;
export type GenderRestriction = (typeof GENDER_RESTRICTIONS)[number];

export type Listing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  locality: string;
  landmark: string | null;
  /** Illustrative only. Never presented as an exact distance. */
  approxDistanceKm: number | null;
  accommodationType: AccommodationType;
  furnishing: Furnishing;
  sharingType: string;

  monthlyRent: number;
  deposit: number | null;
  maintenance: number | null;
  otherCharges: string | null;
  pricingNotes: string | null;

  capacity: number | null;
  occupied: number | null;
  availableFrom: string | null;

  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  houseRules: string[];
  genderRestriction: GenderRestriction | null;
  images: string[];
  /** Public URLs of video tours (Supabase Storage). */
  videos: string[];

  /** Landlord / current tenant details for staff. Internal only — never sent to public pages. */
  ownerName: string | null;
  ownerContact: string | null;
  ownerIdentityChecked: boolean;
  listingDetailsReviewed: boolean;
  /** Internal only — never sent to public pages. */
  verificationNotes: string;

  published: boolean;
  /** "admin" / "agent": posted by REHLO staff. "public-vacancy": submitted by a student, unpublished until reviewed. */
  source: "admin" | "agent" | "public-vacancy";
  /** The agent who owns this listing; null for admin-posted listings and unclaimed vacancies. */
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffRole = "admin" | "agent";

/** Who is signed in to the staff area. */
export type StaffSession = { role: StaffRole; id: string | null; name: string; username: string };

export type StaffAgent = {
  id: string;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryWithFeedback = StudentEnquiry & { feedback: EnquiryFeedback[] };

export type EnquiryFeedback = {
  id: number;
  enquiryId: string;
  authorId: string | null;
  authorName: string;
  status: EnquiryStatus;
  body: string;
  createdAt: string;
};

export type EnquiryStatus = "new" | "contacted" | "follow-up" | "closed";
export type EnquiryType = "property-enquiry" | "callback";
export type AccommodationRequirement =
  | "full-flat"
  | "vacant-room"
  | "private-room"
  | "shared-room"
  | "pg"
  | "hostel"
  | "pg-hostel"
  | "flexible";

export type StudentEnquiry = {
  id: string;
  type: EnquiryType;
  status: EnquiryStatus;

  listingId: string | null;
  listingTitleSnapshot: string | null;

  fullName: string;
  mobile: string;
  email: string | null;
  whatsappPreferred: boolean;
  yearOfStudy: string;

  accommodationRequirement: AccommodationRequirement;
  groupSize: number;
  occupantsFor: string | null;
  vacanciesNeeded: number | null;
  preferredBedrooms: number | null;
  wholeFlatTogether: boolean | null;
  sharedCommonAreasOk: boolean | null;
  joiningWith: string | null;
  pgSharing: string | null;
  mealsRequired: boolean | null;

  budget: string;
  preferredLocality: string;
  moveInDate: string | null;
  moveInFlexible: boolean;
  preferredCallbackTime: string | null;
  additionalRequirements: string | null;

  internalNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRequest = {
  id: string;
  category: string;
  locality: string;
  issue: string;
  preferredDate: string;
  contactPreference: "Phone call" | "WhatsApp" | "Email";
  contact: string;
  status: EnquiryStatus;
  internalNote: string;
  createdAt: string;
  updatedAt: string;
};

export type SleepSchedule = "Early riser" | "Night owl" | "Flexible";
export type Cleanliness = "Very tidy" | "Tidy enough" | "Relaxed";
export type KitchenHabit = "Cooks most days" | "Cooks sometimes" | "Mostly eats out";
export type SmokingPref = "Non-smoker" | "Smoker" | "Prefer not to say";
export type NoiseTolerance = "Likes it quiet" | "Some noise is fine" | "Lively is good";
export type MoveInTimeline = "Right away" | "Within a month" | "Next semester";
export type SharingPref = "Twin sharing" | "Own room in a shared flat" | "Triple sharing" | "Open to anything";

export type FlatmateProfile = {
  id: string;
  displayName: string;
  year: string;
  course: string;
  budget: number;
  locality: string;
  sharing: SharingPref;
  sleep: SleepSchedule;
  cleanliness: Cleanliness;
  kitchen: KitchenHabit;
  smoking: SmokingPref | null;
  noise: NoiseTolerance;
  moveIn: MoveInTimeline;
  interests: string[];
  bio: string;
  isSample: true;
};

export type FlatmatePreferences = {
  budget: number;
  locality: string;
  sharing: SharingPref;
  sleep: SleepSchedule;
  cleanliness: Cleanliness;
  kitchen: KitchenHabit;
  smoking: SmokingPref | "";
  noise: NoiseTolerance;
  moveIn: MoveInTimeline;
  interests: string[];
};

export const SERVICE_CATEGORIES = ["cleaning", "plumbing", "electrical", "appliance", "pest-control"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
