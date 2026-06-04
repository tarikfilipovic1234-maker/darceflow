import { prisma } from "@/lib/db";
import type {
  Invoice,
  Plan,
  Subscription,
} from "@/lib/generated/prisma/client";
import type { SubscriptionStatus } from "@/lib/generated/prisma/enums";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["TRIALING", "ACTIVE", "PAST_DUE"];

export const ACTIVE_SUBSCRIPTION_STATUSES = ACTIVE_STATUSES;

export type CurrentSubscription = Subscription & {
  plan: Plan | null;
  invoices: Invoice[];
};

/** Returns the user's most recent non-cancelled subscription, or null. */
export async function getCurrentSubscription(
  userId: string,
): Promise<CurrentSubscription | null> {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { startedAt: "desc" },
    include: {
      plan: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
}

/** Returns whether the user has at least one PAST_DUE subscription. */
export async function isPastDue(userId: string): Promise<boolean> {
  const count = await prisma.subscription.count({
    where: { userId, status: "PAST_DUE" },
  });
  return count > 0;
}

/** Sum of monthly recurring revenue across active subscriptions in a gym. */
export async function computeGymMrrCents(gymId: string): Promise<number> {
  const subs = await prisma.subscription.findMany({
    where: { gymId, status: { in: ["ACTIVE", "TRIALING"] } },
    include: { plan: true },
  });
  let total = 0;
  for (const s of subs) {
    if (!s.plan) continue;
    if (s.plan.interval === "MONTH") total += s.plan.amountCents;
    else total += Math.round(s.plan.amountCents / 12);
  }
  return total;
}
