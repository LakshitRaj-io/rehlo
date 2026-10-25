import type { Metadata } from "next";
import { VacancyForm } from "@/components/forms/vacancy-form";
import { SITE_URL } from "@/lib/site-url";

const BASE = SITE_URL;

export const metadata: Metadata = {
  title: "Post a Room Vacancy near SRM KTR — Find a Flatmate",
  description:
    "Got a free room or bed in your flat near SRM KTR? Post the vacancy on REHLO. Our agents verify it and handle every enquiry, so your number stays private.",
  alternates: {
    canonical: `${BASE}/post-a-vacancy`,
  },
};

const STEPS = [
  { title: "Tell us what's free", body: "Two minutes. A photo or short video helps." },
  { title: "An agent verifies it", body: "We call you and check the room before anything goes live." },
  { title: "We handle enquiries", body: "Students contact REHLO, not you. We bring you the good fits." },
];

export default function PostVacancyPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="display text-[clamp(3rem,8vw,7rem)]">
            Room free?
            <br />
            <span className="bg-lime px-2 [box-decoration-break:clone]">Fill it right.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg">
            For students with a spare room or bed in the flat they live in. Whole flats, PGs and hostels are listed by REHLO
            agents only, so everything on the site is verified.
          </p>
          <ol className="mt-10 flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="display grid size-12 shrink-0 place-items-center border-2 border-ink bg-warm text-2xl">{i + 1}</span>
                <div>
                  <p className="font-display text-xl font-extrabold">{s.title}</p>
                  <p className="text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <VacancyForm />
      </div>
    </div>
  );
}
