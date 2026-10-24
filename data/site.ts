export const site = {
  name: "REHLO",
  tagline: "Find your place.",
  announcement: "Hey SRM. Your next place starts here.",
  marquee: ["Less scrolling", "Better stays", "Good roommates", "More college life"],
  campus: "SRM KTR, Kattankulathur",
};

export const LOCALITIES = [
  "Potheri",
  "Kattankulathur",
  "Guduvanchery",
  "Maraimalai Nagar",
  "Urapakkam",
  "Nandivaram",
] as const;

export const AMENITIES = [
  "Wi-Fi",
  "AC",
  "Meals included",
  "Attached bathroom",
  "Washing machine",
  "Power backup",
  "Hot water",
  "Study desk",
  "Housekeeping",
  "CCTV at entrance",
  "Two-wheeler parking",
  "Fridge",
  "RO water",
  "Kitchen access",
] as const;

export const YEARS_OF_STUDY = [
  "Joining / incoming student",
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "Postgraduate",
  "Other",
] as const;

export const BUDGET_BANDS = [
  "Under ₹5,000",
  "₹5,000–₹8,000",
  "₹8,000–₹12,000",
  "₹12,000–₹18,000",
  "₹18,000+",
  "Flexible",
] as const;

/** Presets used by the hero search. min/max map onto /explore query params. */
export const BUDGET_PRESETS = [
  { label: "Any budget", min: null, max: null },
  { label: "Under ₹6k", min: null, max: 6000 },
  { label: "₹6k – ₹10k", min: 6000, max: 10000 },
  { label: "₹10k – ₹15k", min: 10000, max: 15000 },
  { label: "₹15k +", min: 15000, max: null },
] as const;
