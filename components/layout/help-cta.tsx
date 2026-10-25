"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, MessageSquareText, PhoneCall } from "lucide-react";
import { openEnquiry } from "@/components/enquiry/enquiry-store";
import { cn } from "@/lib/utils";

/**
 * Band above the footer on every public page: a general enquiry / callback for anyone
 * unsure what they need (it lands in the staff Enquiries tab, visible to the admin and
 * all agents), and the vacancy form for students with a spare room.
 */
export function HelpCta() {
  const pathname = usePathname();
  const showVacancy = pathname !== "/post-a-vacancy";

  return (
    <section aria-label="Get help or post a vacancy" className="border-b-2 border-warm/15 bg-ink text-warm">
      <div className={cn("mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-8 md:py-24", showVacancy && "lg:grid-cols-2 lg:gap-16")}>
        <div className="flex flex-col gap-6">
          <h2 className="display text-[clamp(2.6rem,7vw,5.5rem)] text-lime">
            Not sure
            <br />
            where to start?
          </h2>
          <p className="max-w-md text-lg text-warm/85">
            Tell us what you&apos;re looking for, or ask anything. A REHLO agent will get back to you.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-lime btn-lg" onClick={() => openEnquiry("enquiry", null)} data-cursor="cta">
              <MessageSquareText className="size-5" aria-hidden="true" />
              Send an enquiry
            </button>
            <button type="button" className="btn btn-lg" onClick={() => openEnquiry("callback", null)}>
              <PhoneCall className="size-5" aria-hidden="true" />
              Request a callback
            </button>
          </div>
        </div>

        {showVacancy && (
          <div className="flex flex-col gap-6 border-t-2 border-warm/15 pt-12 lg:border-l-2 lg:border-t-0 lg:pl-16 lg:pt-0">
            <h2 className="display text-[clamp(2.6rem,7vw,5.5rem)] text-lime">
              Room free
              <br />
              in your flat?
            </h2>
            <p className="max-w-md text-lg text-warm/85">
              Post the vacancy. A REHLO agent verifies it and handles every enquiry, so your number stays private.
            </p>
            <Link href="/post-a-vacancy" className="btn btn-lime btn-lg self-start" data-cursor="cta">
              Post a vacancy
              <ArrowUpRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
