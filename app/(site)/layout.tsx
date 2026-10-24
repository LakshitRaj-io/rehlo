import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryHost } from "@/components/enquiry/enquiry-host";
import { getPublishedListings } from "@/lib/db/queries";
import { ListingsProvider } from "@/lib/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const listings = await getPublishedListings();
  return (
    <ListingsProvider listings={listings}>
      <a
        href="#main"
        className="sr-only z-[120] bg-lime px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:border-2 focus:border-ink"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <EnquiryHost />
    </ListingsProvider>
  );
}
