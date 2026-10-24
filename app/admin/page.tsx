import { Suspense } from "react";
import { getStaff, usingDefaultAdminPassword } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/admin";
import { getAgents, getEnquiries, getServiceRequests, getStaffListings } from "@/lib/db/queries";
import { StaffLogin } from "@/components/admin/staff-login";
import { AdminApp } from "@/components/admin/admin-app";
import { AdminProvider } from "@/components/admin/admin-context";

// Always per-request: it reads the session cookie and live data, and must never be cached.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!supabaseConfigured()) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-xl place-items-center p-6">
        <div className="border-2 border-ink bg-warm p-6 shadow-[var(--shadow-hard)]">
          <h1 className="display text-4xl">Database not connected</h1>
          <p className="mt-3">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code> (and in
            Vercel), then restart or redeploy.
          </p>
        </div>
      </main>
    );
  }

  const staff = await getStaff();
  if (!staff) return <StaffLogin />;

  const isAdmin = staff.role === "admin";
  const [listings, enquiries, services, agents] = await Promise.all([
    getStaffListings(staff),
    getEnquiries(),
    isAdmin ? getServiceRequests() : Promise.resolve([]),
    isAdmin ? getAgents() : Promise.resolve([]),
  ]);

  return (
    <AdminProvider initial={{ staff, listings, enquiries, services, agents, usingDefaultPassword: isAdmin && usingDefaultAdminPassword() }}>
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    </AdminProvider>
  );
}
