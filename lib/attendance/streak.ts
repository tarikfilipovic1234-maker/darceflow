import { startOfLocalDay } from "@/lib/attendance/sessions";

/**
 * Given the user's existing stats and a new check-in time, compute the next
 * currentStreak / longestStreak / lastTrainedAt values. Multiple check-ins on
 * the same day don't extend the streak.
 */
export function nextStreak(
  stats: { currentStreak: number; longestStreak: number; lastTrainedAt: Date | null },
  now: Date,
) {
  const today = startOfLocalDay(now);
  const previous = stats.lastTrainedAt ? startOfLocalDay(stats.lastTrainedAt) : null;

  let currentStreak = stats.currentStreak;

  if (!previous) {
    currentStreak = 1;
  } else {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((today.getTime() - previous.getTime()) / msPerDay);
    if (diffDays === 0) {
      // Same day — no change.
    } else if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(stats.longestStreak, currentStreak);
  return { currentStreak, longestStreak, lastTrainedAt: now };
}
