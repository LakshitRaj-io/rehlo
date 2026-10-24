"use client";

import { useSyncExternalStore } from "react";
import type { Listing } from "@/types";

/**
 * Which enquiry dialog is open, and for which listing. One <EnquiryHost /> renders it,
 * so cards don't each mount a dialog.
 */
export type EnquiryRequest = { mode: "enquiry" | "callback"; listing: Listing | null } | null;

let current: EnquiryRequest = null;
const listeners = new Set<() => void>();

export function openEnquiry(mode: "enquiry" | "callback", listing: Listing | null) {
  current = { mode, listing };
  listeners.forEach((l) => l());
}

export function closeEnquiry() {
  current = null;
  listeners.forEach((l) => l());
}

export function useEnquiryRequest(): EnquiryRequest {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}
