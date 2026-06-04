import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type {
  InvoiceStatus,
  SubscriptionStatus,
} from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  paused: "CANCELED",
};

const INVOICE_STATUS_MAP: Record<string, InvoiceStatus> = {
  draft: "DRAFT",
  open: "OPEN",
  paid: "PAID",
  uncollectible: "UNCOLLECTIBLE",
  void: "VOID",
};

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription) {
  const userId = (sub.metadata?.userId as string | undefined) ?? null;
  const gymId = (sub.metadata?.gymId as string | undefined) ?? null;
  const planId = (sub.metadata?.planId as string | undefined) ?? null;
  if (!userId || !gymId) return;

  const status = STATUS_MAP[sub.status] ?? "INCOMPLETE";
  const periodEnd = sub.items.data[0]?.current_period_end;

  const data = {
    userId,
    gymId,
    planId,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    endedAt: sub.ended_at ? new Date(sub.ended_at * 1000) : null,
  };

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: data,
    create: data,
  });
}

async function upsertInvoiceFromStripe(invoice: Stripe.Invoice) {
  const subId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;
  if (!subId) return;

  const localSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subId },
    select: { id: true, userId: true, gymId: true },
  });
  if (!localSub) return;

  const status = (INVOICE_STATUS_MAP[invoice.status ?? "draft"] ?? "DRAFT") as InvoiceStatus;

  const data = {
    subscriptionId: localSub.id,
    userId: localSub.userId,
    gymId: localSub.gymId,
    stripeInvoiceId: invoice.id ?? null,
    amountDueCents: invoice.amount_due,
    amountPaidCents: invoice.amount_paid,
    currency: invoice.currency,
    status,
    paidAt: invoice.status === "paid" ? new Date() : null,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
  };

  if (!invoice.id) return;
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: data,
    create: data,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.finalized":
        await upsertInvoiceFromStripe(event.data.object as Stripe.Invoice);
        break;

      default:
        // Acknowledge unhandled events so Stripe doesn't keep retrying.
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Handler failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 },
    );
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard");

  return NextResponse.json({ received: true });
}
