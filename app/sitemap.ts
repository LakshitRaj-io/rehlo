import type { MetadataRoute } from "next";
import { getPublishedListings } from "@/lib/db/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehlo.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/flatmates`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/post-a-vacancy`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = (await getPublishedListings()).map((l) => ({
    url: `${BASE}/stay/${l.slug}`,
    lastModified: new Date(l.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...listingRoutes];
}
