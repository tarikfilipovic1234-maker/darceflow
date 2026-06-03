import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireRole } from "@/lib/db/scoped";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInPage() {
  await requireRole(["ADMIN", "COACH"]);
  return (
    <ComingSoon
      title="Check-in"
      description="Take roll for today's classes."
      phase="Phase 5"
      highlights={[
        "Live roster per session with one-tap check-in",
        "Per-student QR code for self check-in",
        "Auto-promote from the waitlist when someone bows out",
        "Belt-rank shown next to each name",
      ]}
    />
  );
}
