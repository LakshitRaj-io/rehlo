"use client";

import { useState } from "react";
import type { Listing, StudentEnquiry } from "@/types";
import { Modal } from "@/components/ui/modal";
import { closeEnquiry, openEnquiry, useEnquiryRequest } from "./enquiry-store";
import { CallbackForm, EnquiryConfirmation, EnquiryForm } from "./enquiry-forms";

/** Single dialog for "Send enquiry" and "Request callback", mounted once in the site layout. */
export function EnquiryHost() {
  const request = useEnquiryRequest();
  return (
    <Modal
      open={request !== null}
      onClose={closeEnquiry}
      size="lg"
      eyebrow="No account needed"
      title={request?.mode === "callback" ? "Request a callback" : "Send an enquiry"}
    >
      {request && <EnquiryBody key={`${request.mode}-${request.listing?.id ?? "none"}`} mode={request.mode} listing={request.listing} />}
    </Modal>
  );
}

function EnquiryBody({ mode, listing }: { mode: "enquiry" | "callback"; listing: Listing | null }) {
  const [done, setDone] = useState<StudentEnquiry | null>(null);
  if (done) return <EnquiryConfirmation enquiry={done} listing={listing} onClose={closeEnquiry} />;
  if (mode === "callback") return <CallbackForm listing={listing} onDone={setDone} />;
  return <EnquiryForm listing={listing} onDone={setDone} onSwitchToCallback={() => openEnquiry("callback", listing)} />;
}
