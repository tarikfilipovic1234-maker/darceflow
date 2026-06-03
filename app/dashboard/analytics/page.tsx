import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireRole } from "@/lib/db/scoped";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireRole(["ADMIN", "COACH"]);
  return (
    <ComingSoon
      title="Analytics"
      description="Numbers that tell you whether your academy is winning."
      phase="Phase 5"
      highlights={[
        "Weekly attendance heatmap, per gym",
        "Mat-hour leaderboard",
        "Retention cohorts by signup month",
        "Belt-progression velocity by coach",
      ]}
    />
  );
}
