import { CircleCheck, CircleDot, Clock3, PhoneOutgoing } from "lucide-react";
import type { EnquiryStatus } from "@/types";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<EnquiryStatus, { label: string; className: string; Icon: typeof CircleDot }> = {
  new: { label: "New", className: "bg-lime", Icon: CircleDot },
  contacted: { label: "Contacted", className: "bg-blue text-warm", Icon: PhoneOutgoing },
  "follow-up": { label: "Follow-up", className: "bg-orange", Icon: Clock3 },
  closed: { label: "Closed", className: "bg-paper-deep text-muted", Icon: CircleCheck },
};

export function StatusBadge({ status, className }: { status: EnquiryStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex w-fit items-center gap-1 border-2 border-ink px-1.5 py-0.5 text-xs font-bold", m.className, className)}>
      <m.Icon className="size-3.5" aria-hidden="true" />
      {m.label}
    </span>
  );
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 border-2 border-ink px-1.5 py-0.5 text-xs font-bold",
        published ? "bg-ink text-lime" : "border-dashed bg-warm text-muted",
      )}
    >
      <span className={cn("inline-block size-2", published ? "bg-lime" : "border border-ink")} aria-hidden="true" />
      {published ? "Published" : "Draft"}
    </span>
  );
}
