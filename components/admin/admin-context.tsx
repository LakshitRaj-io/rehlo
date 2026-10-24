"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { EnquiryFeedback, EnquiryWithFeedback, Listing, ServiceRequest, StaffAgent, StaffSession, StudentEnquiry } from "@/types";

/**
 * Staff-area state. The server loads only what the signed-in role may see
 * (agents get their own listings and no staff or service data), and each
 * successful server action patches this local copy so the UI updates at once.
 */
export type AdminInitial = {
  staff: StaffSession;
  listings: Listing[];
  enquiries: EnquiryWithFeedback[];
  services: ServiceRequest[];
  agents: StaffAgent[];
  usingDefaultPassword: boolean;
};

type AdminValue = AdminInitial & {
  isAdmin: boolean;
  agentName: (id: string | null) => string;
  putListing: (l: Listing) => void;
  dropListing: (id: string) => void;
  putEnquiry: (e: StudentEnquiry, feedback?: EnquiryFeedback) => void;
  dropEnquiry: (id: string) => void;
  putService: (s: ServiceRequest) => void;
  dropService: (id: string) => void;
  putAgent: (a: StaffAgent) => void;
  dropAgent: (id: string) => void;
};

const AdminContext = createContext<AdminValue | null>(null);

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
}

export function AdminProvider({ initial, children }: { initial: AdminInitial; children: ReactNode }) {
  const [listings, setListings] = useState(initial.listings);
  const [enquiries, setEnquiries] = useState(initial.enquiries);
  const [services, setServices] = useState(initial.services);
  const [agents, setAgents] = useState(initial.agents);

  const putEnquiry = useCallback((e: StudentEnquiry, feedback?: EnquiryFeedback) => {
    setEnquiries((list) =>
      list.map((x) => (x.id === e.id ? { ...e, feedback: feedback ? [...x.feedback, feedback] : x.feedback } : x)),
    );
  }, []);

  const value = useMemo<AdminValue>(() => {
    const names = new Map(agents.map((a) => [a.id, a.displayName]));
    return {
      ...initial,
      listings,
      enquiries,
      services,
      agents,
      isAdmin: initial.staff.role === "admin",
      agentName: (id) => (id ? names.get(id) ?? (id === initial.staff.id ? initial.staff.name : "Agent") : "Unassigned"),
      putListing: (l) => setListings((list) => upsert(list, l)),
      dropListing: (id) => setListings((list) => list.filter((l) => l.id !== id)),
      putEnquiry,
      dropEnquiry: (id) => setEnquiries((list) => list.filter((e) => e.id !== id)),
      putService: (s) => setServices((list) => upsert(list, s)),
      dropService: (id) => setServices((list) => list.filter((s) => s.id !== id)),
      putAgent: (a) => setAgents((list) => upsert(list, a)),
      dropAgent: (id) => setAgents((list) => list.filter((a) => a.id !== id)),
    };
  }, [initial, listings, enquiries, services, agents, putEnquiry]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminValue {
  const v = useContext(AdminContext);
  if (!v) throw new Error("useAdmin must be used inside <AdminProvider>");
  return v;
}
