import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireRole } from "@/lib/db/scoped";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  await requireRole(["ADMIN"]);
  return (
    <ComingSoon
      title="Billing"
      description="Memberships, invoices, and Stripe payouts for your gym."
      phase="Phase 8"
      highlights={[
        "Stripe-powered membership plans and Checkout",
        "Past-due recovery flow with email + in-app banner",
        "Per-member invoice history and PDF downloads",
        "Stripe customer portal link for self-service",
      ]}
    />
  );
}
