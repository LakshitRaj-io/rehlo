import { CircleDashed, ClipboardCheck, UserCheck } from "lucide-react";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Verification is shown as two separate, explicitly-worded checks — never a single
 * "verified" badge — and always pairs an icon + text so it never relies on colour.
 */
export function VerificationList({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const items = [
    {
      done: listing.ownerIdentityChecked,
      yes: "Landlord verified by REHLO",
      no: "Landlord not verified yet",
      Icon: UserCheck,
    },
    {
      done: listing.listingDetailsReviewed,
      yes: "Details checked by REHLO",
      no: "Details not checked yet",
      Icon: ClipboardCheck,
    },
  ];
  return (
    <ul className={cn("flex flex-col", compact ? "gap-1" : "gap-2")}>
      {items.map(({ done, yes, no, Icon }) => (
        <li key={yes} className={cn("flex items-center gap-2 font-semibold", compact ? "text-xs" : "text-sm", done ? "text-success" : "text-muted")}>
          {done ? (
            <Icon className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden="true" />
          ) : (
            <CircleDashed className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden="true" />
          )}
          <span>{done ? yes : no}</span>
        </li>
      ))}
    </ul>
  );
}
