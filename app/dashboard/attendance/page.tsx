import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return (
    <ComingSoon
      title="Attendance"
      description="Track who's on the mat, when, and for how long."
      phase="Phase 5"
      highlights={[
        "Today's check-ins across every class",
        "Weekly attendance heatmap per athlete",
        "Streaks and milestone alerts",
        "Mat-hour totals and trends",
      ]}
    />
  );
}
