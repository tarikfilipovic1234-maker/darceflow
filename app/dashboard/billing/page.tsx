import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, FileText } from "lucide-react";

import {
  checkoutAction,
  customerPortalAction,
  toggleCancelAtPeriodEndAction,
} from "@/app/dashboard/billing/actions";
import { PlanCard } from "@/components/billing/plan-card";
import { SubscriptionStatusBadge } from "@/components/billing/subscription-status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireGymId, requireSession } from "@/lib/db/scoped";
import { getCurrentSubscription } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

const ERROR_COPY: Record<string, string> = {
  "stripe-not-configured":
    "Stripe isn't configured on this deployment. Ask the admin to set STRIPE_SECRET_KEY.",
  "plan-not-stripe-ready":
    "This plan hasn't been synced to Stripe yet — ask an admin to recreate it.",
  "checkout-failed": "Stripe didn't return a checkout URL. Try again or contact support.",
  "no-customer": "No Stripe customer on file yet — subscribe to a plan first.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const sp = await searchParams;

  const [current, plans] = await Promise.all([
    getCurrentSubscription(session.user.id),
    prisma.plan.findMany({
      where: { gymId, archived: false },
      orderBy: { amountCents: "asc" },
    }),
  ]);

  const errorKey = sp.error;
  const errorMessage = errorKey ? ERROR_COPY[errorKey] ?? "Something went wrong." : null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Billing"
        description={
          current
            ? "Your membership, invoices, and payment method."
            : "Pick a plan to get started."
        }
        actions={
          current ? (
            <form action={customerPortalAction}>
              <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Customer portal
              </Button>
            </form>
          ) : null
        }
      />

      <div className="space-y-6">
        {sp.checkout === "success" ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <span>Welcome! Your subscription is being processed by Stripe.</span>
          </div>
        ) : null}
        {sp.checkout === "cancelled" ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>You cancelled the checkout. No changes were made.</span>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {current ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    {current.plan?.name ?? "Subscription"}
                  </CardTitle>
                  <SubscriptionStatusBadge status={current.status} />
                </div>
                <CardDescription className="mt-1">
                  {current.plan
                    ? `${formatMoney(current.plan.amountCents, current.plan.currency)} per ${
                        current.plan.interval === "MONTH" ? "month" : "year"
                      }`
                    : "Custom plan"}
                  {current.currentPeriodEnd
                    ? ` · renews ${formatDate(current.currentPeriodEnd)}`
                    : ""}
                </CardDescription>
              </div>
              <form action={toggleCancelAtPeriodEndAction}>
                <input type="hidden" name="subscriptionId" value={current.id} />
                <input
                  type="hidden"
                  name="cancel"
                  value={current.cancelAtPeriodEnd ? "false" : "true"}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant={current.cancelAtPeriodEnd ? "outline" : "ghost"}
                  className={cn(
                    current.cancelAtPeriodEnd &&
                      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
                  )}
                >
                  {current.cancelAtPeriodEnd ? "Resume" : "Cancel at period end"}
                </Button>
              </form>
            </CardHeader>
            {current.status === "PAST_DUE" ? (
              <CardContent>
                <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-200">
                  Your last payment failed. Open the customer portal to update your card.
                </div>
              </CardContent>
            ) : null}
            {current.cancelAtPeriodEnd && current.currentPeriodEnd ? (
              <CardContent>
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                  Cancelling on {formatDate(current.currentPeriodEnd)}. You can resume any time
                  before then.
                </div>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        {!current ? (
          plans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No plans available yet"
              description="Your gym admin hasn't set up membership plans. Ask them to add one."
            />
          ) : (
            <div>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Choose a plan
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((p, idx) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    highlighted={idx === 1 && plans.length >= 3}
                    action={
                      <form action={checkoutAction}>
                        <input type="hidden" name="planId" value={p.id} />
                        <Button type="submit" className="w-full">
                          Subscribe
                        </Button>
                      </form>
                    }
                  />
                ))}
              </div>
              {!isStripeConfigured() ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Stripe is not configured on this deployment. Subscribing will surface an error
                  message; admins can still review plans here.
                </p>
              ) : null}
            </div>
          )
        ) : null}

        {current ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invoices</CardTitle>
              <CardDescription>Last 12 invoices on this subscription.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {current.invoices.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No invoices yet — your first one lands at the end of the period.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {current.invoices.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-3 px-6 py-3 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {formatMoney(i.amountDueCents, i.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {i.status} · {formatDate(i.createdAt)}
                        </p>
                      </div>
                      {i.hostedInvoiceUrl ? (
                        <a
                          href={i.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          View
                        </a>
                      ) : null}
                      {i.invoicePdf ? (
                        <a
                          href={i.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          PDF
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
