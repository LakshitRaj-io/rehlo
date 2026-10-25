import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView } from "@/components/listings/explore-view";
import { BreadcrumbSchema } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-url";

const BASE = SITE_URL;

export const metadata: Metadata = {
  title: "Explore PGs, Flats & Rooms near SRM KTR",
  description:
    "Browse and filter PGs, shared rooms, flats and hostels near SRM KTR by budget, locality, type, furnishing and amenities. Transparent pricing, no brokerage.",
  alternates: {
    canonical: `${BASE}/explore`,
  },
};

export default function ExplorePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: BASE },
          { name: "Explore Stays", url: `${BASE}/explore` },
        ]}
      />
      <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8"><p className="display text-5xl">Loading stays…</p></div>}>
        <ExploreView />
      </Suspense>
    </>
  );
}
