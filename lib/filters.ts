import type { AccommodationType, Furnishing, GenderRestriction, Listing } from "@/types";
import { ACCOMMODATION_TYPES, FURNISHING, GENDER_RESTRICTIONS } from "@/types";

export type SortKey = "relevance" | "price-asc" | "price-desc" | "newest";
export type VerifiedFilter = "" | "owner" | "listing" | "both";
/** "vacancy": a room or bed in an occupied flat; "whole": a whole flat, PG or hostel. */
export type KindFilter = "" | "vacancy" | "whole";

export type ListingFilters = {
  q: string;
  locality: string;
  kind: KindFilter;
  type: AccommodationType | "";
  min: number | null;
  max: number | null;
  sharing: string;
  furnishing: Furnishing | "";
  gender: GenderRestriction | "";
  amenities: string[];
  verified: VerifiedFilter;
  sort: SortKey;
};

export const EMPTY_FILTERS: ListingFilters = {
  q: "",
  locality: "",
  kind: "",
  type: "",
  min: null,
  max: null,
  sharing: "",
  furnishing: "",
  gender: "",
  amenities: [],
  verified: "",
  sort: "relevance",
};

type ParamsLike = { get(name: string): string | null };

function num(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function oneOf<T extends string>(v: string | null, options: readonly T[]): T | "" {
  return v && (options as readonly string[]).includes(v) ? (v as T) : "";
}

export function parseFilters(params: ParamsLike): ListingFilters {
  const sort = params.get("sort");
  const verified = params.get("verified");
  const kind = params.get("kind");
  return {
    q: params.get("q") ?? "",
    locality: params.get("locality") ?? "",
    kind: kind === "vacancy" || kind === "whole" ? kind : "",
    type: oneOf(params.get("type"), ACCOMMODATION_TYPES),
    min: num(params.get("min")),
    max: num(params.get("max")),
    sharing: params.get("sharing") ?? "",
    furnishing: oneOf(params.get("furnishing"), FURNISHING),
    gender: oneOf(params.get("gender"), GENDER_RESTRICTIONS),
    amenities: (params.get("amenities") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    verified: verified === "owner" || verified === "listing" || verified === "both" ? verified : "",
    sort: sort === "price-asc" || sort === "price-desc" || sort === "newest" ? sort : "relevance",
  };
}

export function filtersToQuery(f: ListingFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.locality) p.set("locality", f.locality);
  if (f.kind) p.set("kind", f.kind);
  if (f.type) p.set("type", f.type);
  if (f.min != null) p.set("min", String(f.min));
  if (f.max != null) p.set("max", String(f.max));
  if (f.sharing) p.set("sharing", f.sharing);
  if (f.furnishing) p.set("furnishing", f.furnishing);
  if (f.gender) p.set("gender", f.gender);
  if (f.amenities.length) p.set("amenities", f.amenities.join(","));
  if (f.verified) p.set("verified", f.verified);
  if (f.sort !== "relevance") p.set("sort", f.sort);
  return p.toString();
}

/** Broad sharing buckets so free-text sharing types can still be filtered. */
export const SHARING_BUCKETS = [
  { value: "single", label: "Single occupancy", test: (s: string) => /single|own room/i.test(s) },
  { value: "twin", label: "Twin sharing", test: (s: string) => /twin|double/i.test(s) },
  { value: "triple", label: "Triple or more", test: (s: string) => /triple|dorm|4-bed/i.test(s) },
  { value: "whole", label: "Whole flat", test: (s: string) => /whole flat/i.test(s) },
] as const;

export function applyFilters(listings: Listing[], f: ListingFilters): Listing[] {
  const q = f.q.trim().toLowerCase();
  const bucket = SHARING_BUCKETS.find((b) => b.value === f.sharing);
  const result = listings.filter((l) => {
    if (q && !`${l.title} ${l.locality} ${l.description}`.toLowerCase().includes(q)) return false;
    if (f.locality && l.locality !== f.locality) return false;
    if (f.kind === "vacancy" && !l.isVacancy) return false;
    if (f.kind === "whole" && l.isVacancy) return false;
    if (f.type && l.accommodationType !== f.type) return false;
    if (f.min != null && l.monthlyRent < f.min) return false;
    if (f.max != null && l.monthlyRent > f.max) return false;
    if (bucket && !bucket.test(l.sharingType)) return false;
    if (f.furnishing && l.furnishing !== f.furnishing) return false;
    if (f.gender && l.genderRestriction !== f.gender) return false;
    if (f.amenities.length && !f.amenities.every((a) => l.amenities.includes(a))) return false;
    if (f.verified === "owner" && !l.ownerIdentityChecked) return false;
    if (f.verified === "listing" && !l.listingDetailsReviewed) return false;
    if (f.verified === "both" && !(l.ownerIdentityChecked && l.listingDetailsReviewed)) return false;
    return true;
  });

  const sorted = [...result];
  if (f.sort === "price-asc") sorted.sort((a, b) => a.monthlyRent - b.monthlyRent);
  else if (f.sort === "price-desc") sorted.sort((a, b) => b.monthlyRent - a.monthlyRent);
  else if (f.sort === "newest") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sorted;
}

export function countActiveFilters(f: ListingFilters): number {
  return (
    (f.q ? 1 : 0) +
    (f.locality ? 1 : 0) +
    (f.kind ? 1 : 0) +
    (f.type ? 1 : 0) +
    (f.min != null ? 1 : 0) +
    (f.max != null ? 1 : 0) +
    (f.sharing ? 1 : 0) +
    (f.furnishing ? 1 : 0) +
    (f.gender ? 1 : 0) +
    f.amenities.length +
    (f.verified ? 1 : 0)
  );
}
