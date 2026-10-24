import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedStays } from "@/components/home/featured-stays";
import { FlatmateSection, LocationSection, OwnerCta, ServicesSection, TrustSection } from "@/components/home/home-sections";
import { Marquee } from "@/components/motion/marquee";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/json-ld";
import { site } from "@/data/site";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehlo.in";

export const metadata: Metadata = {
  title: "REHLO — PGs, Flats & Rooms near SRM KTR, Kattankulathur",
  description:
    "Find affordable PGs, flats, shared rooms, hostels near SRM KTR Kattankulathur. Verified student accommodation in Potheri, Guduvanchery, Urapakkam. No broker fees. Transparent pricing.",
  alternates: {
    canonical: BASE,
  },
};

const FAQS = [
  {
    question: "How do I find a PG or flat near SRM KTR?",
    answer:
      "Use REHLO's search to filter PGs, flats, shared rooms and hostels by locality (Potheri, Kattankulathur, Guduvanchery), budget, furnishing and more. Each listing shows transparent rent, deposit and vacancy details.",
  },
  {
    question: "What areas near SRM does REHLO cover?",
    answer:
      "REHLO covers Potheri, Kattankulathur, Guduvanchery, Maraimalai Nagar, Urapakkam and Nandivaram — the key localities around SRM Institute of Science and Technology.",
  },
  {
    question: "Is there a brokerage fee on REHLO?",
    answer:
      "No. Every stay is listed by a REHLO agent and every deal goes through us, with no brokerage charged to students.",
  },
  {
    question: "How are listings verified on REHLO?",
    answer:
      "Every listing is posted by a REHLO agent, who checks the details in person and verifies the landlord. Both checks are shown separately on each listing so you know exactly what has been verified.",
  },
  {
    question: "Can I find a flatmate through REHLO?",
    answer:
      "Yes! REHLO's flatmate finder matches you with compatible roommates based on budget, locality, sleep schedule, cleanliness preferences and lifestyle habits.",
  },
];

export default function HomePage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: BASE }]} />
      <FAQSchema faqs={FAQS} />
      <HeroSection />
      <Marquee items={site.marquee} />
      <FeaturedStays />
      <FlatmateSection />
      <ServicesSection />
      <TrustSection />
      <Marquee items={["Clear rent", "Real checks", "No broker drama", "Student first"]} />
      <LocationSection />
      <OwnerCta />
    </>
  );
}
