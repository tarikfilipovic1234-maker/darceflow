import { NextResponse } from "next/server";

import { expandRecurringSessions } from "@/lib/scheduling/expand-recurrence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/expand-sessions
 *
 * Materializes ClassSession rows for the next 8 weeks across every gym.
 * Vercel cron sends `Authorization: Bearer <CRON_SECRET>`; if you trigger
 * it manually, set the same header.
 *
 * In `vercel.json`:
 *   { "crons": [{ "path": "/api/cron/expand-sessions", "schedule": "0 3 * * *" }] }
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const written = await expandRecurringSessions();
  return NextResponse.json({ ok: true, written });
}
