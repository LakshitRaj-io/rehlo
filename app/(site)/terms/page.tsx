import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "REHLO terms of use — the terms governing your use of our student accommodation platform.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-14 md:px-8">
      <h1 className="display text-6xl md:text-7xl">Terms</h1>
      <div className="mt-8 flex flex-col gap-5 text-lg">
        <p>REHLO helps students find accommodation and home services near SRM Institute of Science and Technology, Kattankulathur.</p>
        <p>Flats, PGs and hostels are listed only by REHLO agents. Students may post a vacancy in a flat they live in; it is published only after a REHLO agent has verified it. REHLO makes reasonable efforts to check listing details and landlords, but cannot guarantee every detail.</p>
        <p>Enquiries and bookings are handled through REHLO. Please visit a property before paying anything, and only make payments as agreed with your REHLO agent.</p>
        <p>By posting a vacancy you confirm you live in the flat and are allowed to share the room, and that the photos and videos you upload are yours to share.</p>
        <p>By using REHLO, you agree to these terms. For questions, contact us at hello@rehlo.in.</p>
      </div>
    </article>
  );
}
