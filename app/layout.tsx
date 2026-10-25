import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { Toaster } from "@/components/ui/toast";
import { WebSiteSchema, LocalBusinessSchema } from "@/components/seo/json-ld";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const BASE = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "REHLO — PGs, Flats & Rooms near SRM KTR, Kattankulathur",
    template: "%s · REHLO",
  },
  description:
    "Find PGs, flats, shared rooms, hostels, flatmates and home services for students near SRM KTR, Kattankulathur, Chennai. Verified listings with transparent pricing.",
  keywords: [
    "flats near SRM",
    "PG near SRM KTR",
    "rooms near SRM University",
    "student accommodation Kattankulathur",
    "flats in Potheri",
    "PG in Kattankulathur",
    "hostel near SRM",
    "shared rooms SRM KTR",
    "flatmates SRM",
    "student housing Chennai",
    "rooms near SRM Kattankulathur",
    "2BHK near SRM",
    "budget PG Potheri",
    "accommodation near SRM University",
    "rental flats Guduvanchery",
    "rooms in Urapakkam",
    "REHLO",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "REHLO",
    title: "REHLO — PGs, Flats & Rooms near SRM KTR",
    description:
      "Find PGs, flats, shared rooms, hostels, flatmates and home services for students near SRM KTR, Kattankulathur, Chennai.",
  },
  twitter: {
    card: "summary_large_image",
    title: "REHLO — Student Housing near SRM KTR",
    description:
      "PGs, flats, rooms, flatmates and home services for students around SRM KTR, Kattankulathur.",
  },
  alternates: {
    canonical: BASE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <CustomCursor />
        <Toaster />
        <WebSiteSchema />
        <LocalBusinessSchema />
      </body>
    </html>
  );
}
