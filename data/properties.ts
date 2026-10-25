/**
 * Default cover photos for properties REHLO lists flats in. When a listing for one of
 * these properties (matched on its `landmark`) is added without photos, the cover
 * is used instead of the generic placeholder.
 */
export const PROPERTY_DEFAULT_PHOTOS: Record<string, string> = {
  "abode valley": "/images/properties/abode-valley.jpg",
};

export function defaultPhotoFor(landmark: string | null | undefined): string | null {
  return landmark ? PROPERTY_DEFAULT_PHOTOS[landmark.trim().toLowerCase()] ?? null : null;
}
