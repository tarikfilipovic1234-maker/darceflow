"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole, requireSession } from "@/lib/db/scoped";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createPlanSchema } from "@/lib/validators/billing";

export type CreatePlanState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function createPlanAction(
  _prev: CreatePlanState | undefined,
  formData: FormData,
): Promise<CreatePlanState> {
  await requireRole(["ADMIN"]);
  const { gymId } = await requireGymId();

  const parsed = createPlanSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    amountCents: String(formData.get("amountCents") ?? "0"),
    interval: String(formData.get("interval") ?? "MONTH"),
    features: String(formData.get("features") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  let stripeProductId: string | null = null;
  let stripePriceId: string | null = null;

  // If Stripe is configured, create a real Product + Price in Stripe so
  // subscribe-to-this-plan goes through Checkout cleanly.
  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const product = await stripe.products.create({
        name: parsed.data.name,
        description: parsed.data.description || undefined,
        metadata: { gymId },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: parsed.data.amountCents,
        currency: "usd",
        recurring: {
          interval: parsed.data.interval === "MONTH" ? "month" : "year",
        },
      });
      stripeProductId = product.id;
      stripePriceId = price.id;
    } catch (err) {
      return {
        error: `Stripe create failed: ${err instanceof Error ? err.message : "unknown error"}`,
      };
    }
  }

  await prisma.plan.create({
    data: {
      gymId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      amountCents: parsed.data.amountCents,
      interval: parsed.data.interval,
      features: parsed.data.features ? parseFeatures(parsed.data.features) : [],
      stripeProductId,
      stripePriceId,
    },
  });

  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/admin/billing/plans");
}

export async function archivePlanAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const { gymId } = await requireGymId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.plan.updateMany({
    where: { id, gymId },
    data: { archived: true },
  });

  revalidatePath("/dashboard/admin/billing/plans");
  revalidatePath("/dashboard/billing");
}

/**
 * Creates a Stripe Checkout session for the chosen plan and redirects the user
 * to it. Falls through with a friendly error if Stripe isn't configured.
 */
export async function checkoutAction(formData: FormData) {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return;

  if (!isStripeConfigured()) {
    redirect("/dashboard/billing?error=stripe-not-configured");
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, gymId, archived: false },
  });
  if (!plan || !plan.stripePriceId) {
    redirect("/dashboard/billing?error=plan-not-stripe-ready");
  }

  const stripe = getStripe();

  // Ensure the user has a Stripe customer.
  let customerId = session.user.email
    ? await prisma.user
        .findUnique({
          where: { id: session.user.id },
          select: { stripeCustomerId: true },
        })
        .then((u) => u?.stripeCustomerId ?? null)
    : null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      metadata: { gymId, userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=cancelled`,
    metadata: { planId: plan.id, userId: session.user.id, gymId },
    subscription_data: {
      metadata: { planId: plan.id, userId: session.user.id, gymId },
    },
  });

  if (!checkout.url) {
    redirect("/dashboard/billing?error=checkout-failed");
  }
  redirect(checkout.url);
}

/** Opens the Stripe Customer Portal for the current user. */
export async function customerPortalAction() {
  const session = await requireSession();
  if (!isStripeConfigured()) {
    redirect("/dashboard/billing?error=stripe-not-configured");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    redirect("/dashboard/billing?error=no-customer");
  }

  const stripe = getStripe();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  redirect(portal.url);
}

/** Toggle cancel-at-period-end on the user's active Stripe subscription. */
export async function toggleCancelAtPeriodEndAction(formData: FormData) {
  const session = await requireSession();
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const cancel = formData.get("cancel") === "true";

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
    select: { stripeSubscriptionId: true },
  });
  if (!sub) return;

  if (sub.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: cancel,
    });
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { cancelAtPeriodEnd: cancel },
  });

  revalidatePath("/dashboard/billing");
}
