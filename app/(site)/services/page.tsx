import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesView } from "@/components/services/services-view";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehlo.in";

export const metadata: Metadata = {
  title: "Home Services near SRM KTR — Cleaning, Plumbing, Electrical",
  description:
    "Book cleaning, plumbing, electrical, appliance repair and pest control services for student flats near SRM KTR, Kattankulathur. Trusted local service providers.",
  alternates: {
    canonical: `${BASE}/services`,
  },
};

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8"><p className="display text-5xl">Loading services…</p></div>}>
      <ServicesView />
    </Suspense>
  );
}
