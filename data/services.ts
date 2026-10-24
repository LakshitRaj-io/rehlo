import type { ServiceCategory } from "@/types";

export const SERVICE_CATEGORY_META: Record<ServiceCategory, { label: string; blurb: string }> = {
  cleaning: { label: "Cleaning", blurb: "Move-in deep cleans and regular room cleaning." },
  plumbing: { label: "Plumbing", blurb: "Leaks, taps, blocked drains and bathroom fittings." },
  electrical: { label: "Electrical", blurb: "Fans, lights, switches and wiring checks." },
  appliance: { label: "Appliance repair", blurb: "Washing machines, fridges, ACs and geysers." },
  "pest-control": { label: "Pest control", blurb: "Cockroaches, ants, mosquitoes and bed bugs." },
};
