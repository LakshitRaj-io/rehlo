import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "REHLO privacy policy — how we handle your data when you use our student accommodation platform.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-14 md:px-8">
      <h1 className="display text-6xl md:text-7xl">Privacy</h1>
      <div className="mt-8 flex flex-col gap-5 text-lg">
        <p>REHLO helps students near SRM KTR find verified accommodation, flatmates and home services. Every listing is posted and managed by REHLO agents.</p>
        <p>When you send an enquiry, request a callback, post a vacancy or request a service, the details you enter (such as your name, phone number and accommodation preferences) are stored securely on our servers. Only REHLO staff can see them, and we use them to respond to your request.</p>
        <p>Your phone number and email are never shown on public pages. Photos and videos you upload with a vacancy may be shown on the listing once a REHLO agent has verified it.</p>
        <p>We do not sell your personal information to third parties. We do not use tracking cookies or third-party analytics at this time.</p>
        <p>Your saved stays are kept only in your own browser. Clearing your browser data removes them.</p>
        <p>To ask what we hold about you, or to have it deleted, contact us at hello@rehlo.in.</p>
      </div>
    </article>
  );
}
