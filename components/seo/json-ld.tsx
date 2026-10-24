import type { Listing } from "@/types";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehlo.in";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "REHLO",
        url: BASE,
        description:
          "Find PGs, flats, rooms, flatmates and home services for students near SRM KTR, Kattankulathur, Chennai.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE}/explore?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function LocalBusinessSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: "REHLO",
        description:
          "Student accommodation platform near SRM Institute of Science and Technology (SRM KTR), Kattankulathur. PGs, flats, shared rooms, hostels, flatmate matching and home services.",
        url: BASE,
        areaServed: {
          "@type": "Place",
          name: "SRM KTR, Kattankulathur, Chennai, Tamil Nadu, India",
          geo: {
            "@type": "GeoCoordinates",
            latitude: 12.8231,
            longitude: 80.0444,
          },
        },
        serviceArea: {
          "@type": "GeoCircle",
          geoMidpoint: {
            "@type": "GeoCoordinates",
            latitude: 12.8231,
            longitude: 80.0444,
          },
          geoRadius: "10000",
        },
        knowsAbout: [
          "Student accommodation",
          "PG near SRM",
          "Flats near SRM KTR",
          "Rooms in Potheri",
          "Rooms in Kattankulathur",
          "Student housing Chennai",
        ],
      }}
    />
  );
}

export function ListingSchema({ listing }: { listing: Listing }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Accommodation",
        name: listing.title,
        description: listing.description,
        url: `${BASE}/stay/${listing.slug}`,
        floorSize: {
          "@type": "QuantitativeValue",
          unitText: listing.bedrooms ? `${listing.bedrooms} bedroom(s)` : listing.sharingType,
        },
        numberOfBedrooms: listing.bedrooms ?? undefined,
        numberOfBathroomsTotal: listing.bathrooms ?? undefined,
        amenityFeature: listing.amenities.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        })),
        address: {
          "@type": "PostalAddress",
          addressLocality: listing.locality,
          addressRegion: "Tamil Nadu",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 12.8231,
          longitude: 80.0444,
        },
        offers: {
          "@type": "Offer",
          price: listing.monthlyRent,
          priceCurrency: "INR",
          // Deterministic: 90 days after the listing was last updated.`n          priceValidUntil: new Date(new Date(listing.updatedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: (listing.capacity ?? 1) - (listing.occupied ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        },
        category: listing.accommodationType,
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url?: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          ...(item.url ? { item: item.url } : {}),
        })),
      }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
