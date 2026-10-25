import type { Metadata } from "next";
import { FlatmateFinder } from "@/components/flatmates/flatmate-finder";
import { SITE_URL } from "@/lib/site-url";

const BASE = SITE_URL;

export const metadata: Metadata = {
  title: "Find a Flatmate near SRM KTR — Roommate Matching",
  description:
    "Find compatible flatmates near SRM KTR, Kattankulathur. Match by budget, locality, sleep schedule, cleanliness and lifestyle. No more random roommate drama.",
  alternates: {
    canonical: `${BASE}/flatmates`,
  },
};

export default function FlatmatesPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <header className="mb-12 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <h1 className="display text-[clamp(3rem,9vw,8rem)]">
          Find your people.
          <br />
          <span className="outline-text">Then find</span> your place.
        </h1>
        <div className="lg:pb-3">
          <p className="text-xl">Similar budgets. Compatible habits. Less roommate drama.</p>
          <a href="#finder" className="btn btn-lime btn-lg mt-6" data-cursor="cta">
            Find my match
          </a>
        </div>
      </header>
      <FlatmateFinder />
    </div>
  );
}
