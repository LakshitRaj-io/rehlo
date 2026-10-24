"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink, LogOut, Plus, ShieldAlert } from "lucide-react";
import { staffLogout } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";
import { REQUIREMENT_LABELS } from "@/lib/validation";
import { Wordmark } from "@/components/layout/wordmark";
import { useAdmin } from "./admin-context";
import { AdminListings } from "./admin-listings";
import { AdminEnquiries } from "./admin-enquiries";
import { AdminServices } from "./admin-services";
import { AdminAgents } from "./admin-agents";
import { ListingEditor } from "./listing-editor";
import { StatusBadge } from "./status-badge";

const ALL_TABS = [
  { id: "overview", label: "Overview", adminOnly: false },
  { id: "listings", label: "Listings", adminOnly: false },
  { id: "enquiries", label: "Enquiries", adminOnly: false },
  { id: "services", label: "Services", adminOnly: true },
  { id: "agents", label: "Agents", adminOnly: true },
] as const;
type Tab = (typeof ALL_TABS)[number]["id"];

export function AdminApp() {
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { staff, isAdmin, listings, enquiries, services, usingDefaultPassword } = useAdmin();
  const tabs = ALL_TABS.filter((t) => isAdmin || !t.adminOnly);
  const raw = params.get("tab");
  const tab: Tab = tabs.find((t) => t.id === raw)?.id ?? "overview";
  const [creating, setCreating] = useState(false);

  const go = (t: Tab) => router.replace(t === "overview" ? "/admin" : `/admin?tab=${t}`, { scroll: false });
  const signOut = async () => {
    await staffLogout();
    router.refresh();
  };

  const stats = {
    total: listings.length,
    published: listings.filter((l) => l.published).length,
    drafts: listings.filter((l) => !l.published).length,
    vacancies: listings.filter((l) => l.source === "public-vacancy" && !l.published).length,
    newEnquiries: enquiries.filter((e) => e.status === "new").length,
    followUps: enquiries.filter((e) => e.status === "follow-up").length,
    newServices: services.filter((s) => s.status === "new").length,
  };

  const cards = [
    { label: isAdmin ? "Total listings" : "My listings", value: stats.total, tab: "listings" as Tab },
    { label: "Published", value: stats.published, tab: "listings" as Tab },
    isAdmin
      ? { label: "Vacancies to review", value: stats.vacancies, tab: "listings" as Tab }
      : { label: "Drafts", value: stats.drafts, tab: "listings" as Tab },
    { label: "New enquiries", value: stats.newEnquiries, tab: "enquiries" as Tab, accent: true },
    { label: "Follow-ups due", value: stats.followUps, tab: "enquiries" as Tab },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-ink text-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-8">
          <Link href="/admin" className="text-3xl" aria-label="Staff home">
            <Wordmark inverted />
          </Link>
          <span className="label hidden -rotate-2 border-2 border-lime px-2 py-1 text-lime sm:inline-flex sm:items-center sm:gap-1.5">
            {isAdmin ? "Admin" : "Agent"}
          </span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-sm text-warm/80 md:block">{staff.name}</span>
            <Link href="/" className="btn btn-sm btn-ghost !text-warm hover:!text-ink" target="_blank" aria-label="View site (opens in a new tab)">
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <button type="button" className="btn btn-sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Staff sections" className="mx-auto max-w-[1440px] px-4 md:px-8">
          <ul className="-mx-1 flex gap-0 overflow-x-auto sm:gap-1">
            {tabs.map((t) => {
              const count = t.id === "enquiries" ? stats.newEnquiries : t.id === "services" ? stats.newServices : null;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => go(t.id)}
                    aria-current={tab === t.id ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2 whitespace-nowrap px-2 pb-3 pt-1 font-display text-base font-extrabold uppercase tracking-tight sm:px-3 sm:text-lg"
                  >
                    {t.label}
                    {count != null && count > 0 && <span className="price bg-lime px-1.5 text-xs text-ink">{count} new</span>}
                    {tab === t.id && (
                      <motion.span layoutId={reduce ? undefined : "admin-tab"} className="absolute inset-x-0 bottom-0 h-1 bg-lime" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {usingDefaultPassword && (
        <div className="border-b-2 border-ink bg-orange">
          <p className="mx-auto flex max-w-[1440px] items-start gap-2 px-4 py-2 text-sm font-semibold md:px-8">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            You&apos;re using the default admin password. Set ADMIN_PASSWORD_HASH (npm run admin:hash) in Vercel before going live.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-8 md:px-8">
        {tab === "overview" && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="display text-5xl md:text-7xl">Overview</h1>
                <p className="mt-2 text-muted">Signed in as {staff.name}{isAdmin ? " (full access)" : " (agent)"}.</p>
              </div>
              <button type="button" className="btn btn-lime self-start" onClick={() => setCreating(true)}>
                <Plus className="size-4" strokeWidth={3} aria-hidden="true" />
                Add listing
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {cards.map((s, i) => (
                <div key={s.label} className={i === 4 ? "col-span-2 md:col-span-1" : undefined}>
                  <button
                    type="button"
                    onClick={() => go(s.tab)}
                    className={`flex h-full w-full flex-col justify-between gap-6 border-2 border-ink p-4 text-left shadow-[var(--shadow-hard)] transition-transform hover:-translate-y-1 ${s.accent ? "bg-lime" : "bg-warm"}`}
                  >
                    <dt className="label">{s.label}</dt>
                    <dd className="price display text-6xl">{s.value}</dd>
                  </button>
                </div>
              ))}
            </dl>

            <section aria-labelledby="recent" className="border-2 border-ink bg-warm">
              <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
                <h2 id="recent" className="font-display text-2xl font-extrabold">Latest enquiries</h2>
                <button type="button" className="link-underline text-sm font-bold" onClick={() => go("enquiries")}>
                  Manage all
                </button>
              </div>
              {enquiries.length === 0 ? (
                <p className="p-6 text-muted">No enquiries yet. They&apos;ll appear here as soon as students send them.</p>
              ) : (
                <ul className="divide-y-2 divide-ink/10">
                  {enquiries.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <span className="price font-bold">{e.id}</span>
                      <span className="flex-1">
                        <strong>{e.fullName}</strong>, {REQUIREMENT_LABELS[e.accommodationRequirement]}
                        {e.listingTitleSnapshot ? ` for ${e.listingTitleSnapshot}` : ""}
                      </span>
                      <span className="text-sm text-muted">{formatDateTime(e.createdAt)}</span>
                      <StatusBadge status={e.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "listings" && <AdminListings onCreate={() => setCreating(true)} />}
        {tab === "enquiries" && <AdminEnquiries />}
        {tab === "services" && isAdmin && <AdminServices />}
        {tab === "agents" && isAdmin && <AdminAgents />}
      </main>

      <ListingEditor open={creating} listing={null} onClose={() => setCreating(false)} onSaved={() => go("listings")} />
    </div>
  );
}
