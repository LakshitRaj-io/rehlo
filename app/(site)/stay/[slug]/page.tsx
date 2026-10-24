import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedListing, getPublishedListings } from "@/lib/db/queries";
import { StayView } from "@/components/listings/stay-detail";
import { ListingSchema, BreadcrumbSchema } from "@/components/seo/json-ld";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehlo.in";

export async function generateStaticParams() {
  return (await getPublishedListings()).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getPublishedListing(slug);
  if (!l) return { title: "Stay not found", robots: { index: false } };
  const title = `${l.title} — ${l.accommodationType} in ${l.locality} near SRM KTR`;
  const description = `${l.accommodationType} in ${l.locality}, ${l.approxDistanceKm ? `~${l.approxDistanceKm} km from SRM KTR` : "near SRM KTR"}. ₹${l.monthlyRent.toLocaleString("en-IN")}/month. ${l.furnishing}. ${l.description.slice(0, 120)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE}/stay/${slug}`,
      type: "website",
      images: l.images[0]?.startsWith("http") ? [{ url: l.images[0] }] : undefined,
    },
    alternates: {
      canonical: `${BASE}/stay/${slug}`,
    },
  };
}

export default async function StayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getPublishedListing(slug);
  if (!listing) notFound();

  return (
    <>
      <ListingSchema listing={listing} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: BASE },
          { name: "Explore Stays", url: `${BASE}/explore` },
          { name: listing.title, url: `${BASE}/stay/${slug}` },
        ]}
      />
      <StayView slug={slug} />
    </>
  );
}
