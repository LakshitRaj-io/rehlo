import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

const BASE = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/saved", "/api"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
