import Link from "next/link";
import { Wordmark } from "./wordmark";

const COLUMNS = [
  {
    title: "Students",
    links: [
      { href: "/explore", label: "Explore stays" },
      { href: "/flatmates", label: "Flatmates" },
      { href: "/services", label: "Home services" },
      { href: "/saved", label: "Saved stays" },
    ],
  },
  {
    title: "Got a spare room?",
    links: [{ href: "/post-a-vacancy", label: "Post a vacancy" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-warm">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-14 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div className="max-w-sm">
          <Link href="/" aria-label="REHLO home" className="text-6xl md:text-7xl">
            <Wordmark inverted />
          </Link>
          <p className="mt-5 text-warm/80">
            Student housing around SRM KTR, without the WhatsApp-forward chaos. Every stay is listed and
            verified by a REHLO agent, and every deal goes through us.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="label mb-4 text-lime">{col.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline font-semibold [background-image:linear-gradient(var(--color-lime),var(--color-lime))]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="label mb-4 text-lime">Contact</h2>
          <p className="text-warm/80">Have questions? Reach out to us.</p>
          <p className="mt-2 text-warm/80">hello@rehlo.in</p>
          <p className="mt-4 text-sm text-warm/60">Follow us on Instagram and LinkedIn for updates.</p>
        </div>
      </div>
      <div className="border-t border-warm/15">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-sm text-warm/70 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} REHLO. All rights reserved.</p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="link-underline [background-image:linear-gradient(var(--color-lime),var(--color-lime))]">Privacy</Link>
            </li>
            <li>
              <Link href="/terms" className="link-underline [background-image:linear-gradient(var(--color-lime),var(--color-lime))]">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
