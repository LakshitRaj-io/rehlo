import type { Metadata } from "next";
import { SavedView } from "@/components/listings/saved-view";

export const metadata: Metadata = { title: "Saved stays" };

export default function SavedPage() {
  return <SavedView />;
}
