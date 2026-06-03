import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Technique library" };

export default function LibraryPage() {
  return (
    <ComingSoon
      title="Technique library"
      description="The academy's playbook — every technique, every position."
      phase="Phase 7"
      highlights={[
        "Video uploads from coaches with Vercel Blob",
        "Filter by position (closed guard, mount, back, …)",
        "Filter by category (submission, sweep, escape, pass, …)",
        "Favorite techniques per athlete",
      ]}
    />
  );
}
