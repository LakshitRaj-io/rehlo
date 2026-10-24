import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

export default function NotFound() {
  return (
    <main className="dot-grid grid min-h-dvh place-items-center px-4 py-16">
      <div className="max-w-2xl border-2 border-ink bg-warm p-8 shadow-[var(--shadow-hard-lg)] md:p-12">
        <Link href="/" className="text-4xl" aria-label="REHLO home">
          <Wordmark />
        </Link>
        <p className="display mt-8 text-[clamp(4rem,14vw,9rem)]">404</p>
        <h1 className="display text-4xl md:text-5xl">Wrong door.</h1>
        <p className="mt-4 text-lg text-muted">That page doesn&apos;t exist. The stays, though, are right where you left them.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explore" className="btn btn-lime btn-lg">
            Explore stays
          </Link>
          <Link href="/" className="btn btn-lg">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
