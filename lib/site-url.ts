/**
 * Absolute site URL for canonical links, the sitemap, structured data and link-preview
 * images. Set NEXT_PUBLIC_SITE_URL once you have a custom domain; until then Vercel's
 * production address is used, so shared links still show the preview image.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || "http://localhost:3000").replace(/\/+$/, "");
