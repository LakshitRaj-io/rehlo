/**
 * Decorative stock photos (Unsplash) for the home hero only. Listing photos are
 * uploaded by staff to Supabase Storage. Rendered through <SafeImage>, which swaps
 * to a local placeholder if a remote photo fails to load.
 */
const u = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const HERO_PHOTOS = {
  bedroom: u("photo-1505693416388-ac5ce068fe85"),
  kitchen: u("photo-1556911220-bff31c812dba"),
  study: u("photo-1524758631624-e2822e304c36"),
} as const;
