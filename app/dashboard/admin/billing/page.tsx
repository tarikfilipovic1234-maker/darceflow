import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleAlert,
  CreditCard,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";

import { SubscriptionStatusBadge } from "@/components/billing/subscription-status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ACTIVE_SUBSCRIPTION_STATUSES, computeGymMrrCents } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing overview" };

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function AdminBillingPage() {
  await requireRole(["ADMIN"]);
  const { gymId } = await requireGymId();

  const [mrrCents, activeCount, pastDueCount, planCount, recentInvoices, pastDue] =
    await Promise.all([
      computeGymMrrCents(gymId),
      prisma.subscription.count({
        where: { gymId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
      }),
      prisma.subscription.count({ where: { gymId, status: "PAST_DUE" } }),
      prisma.plan.count({ where: { gymId, archived: false } }),
      prisma.invoice.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.subscription.findMany({
        where: { gymId, status: "PAST_DUE" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Billing"
        description="Monthly recurring revenue, subscriptions, and invoices for your gym."
        actions={
          <Link
            href="/dashboard/admin/billing/plans"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <CreditCard className="h-4 w-4" />
            Manage plans
          </Link>
        }
      />

      <div className="space-y-6">
        {!isStripeConfigured() ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            Stripe is not configured. Set <code>STRIPE_SECRET_KEY</code> and{" "}
            <code>STRIPE_WEBHOOK_SECRET</code> in your env to enable real checkouts and
            webhooks. The data below uses local Plan / Subscription / Invoice records.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Monthly recurring revenue"
            value={formatMoney(mrrCents)}
            icon={TrendingUp}
            hint="active + trialing"
          />
          <StatsCard
            label="Active subscriptions"
            value={activeCount}
            icon={Users}
            hint="paying members"
          />
          <StatsCard
            label="Past due"
            value={pastDueCount}
            icon={CircleAlert}
            hint={pastDueCount === 0 ? "Everyone's current" : "Reach out and recover"}
          />
          <StatsCard
            label="Active plans"
            value={planCount}
            icon={CreditCard}
            hint="published to members"
          />
        </div>

        {pastDue.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <div>
                  <CardTitle className="text-base font-semibold">Past-due subscriptions</CardTitle>
                  <CardDescription>
                    Last payment failed for these members. The Stripe customer portal lets
                    them update their card.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {pastDue.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/members/${s.user.id}`}
                      className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {s.user.name ?? s.user.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.plan?.name ?? "Unknown plan"}
                          {s.currentPeriodEnd
                            ? ` · period ends ${formatDate(s.currentPeriodEnd)}`
                            : ""}
                        </p>
                      </div>
                      <SubscriptionStatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent invoices</CardTitle>
              <CardDescription>The last few across the gym.</CardDescription>
            </div>
            <Link
              href="/dashboard/admin/billing/plans"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1",
              )}
            >
              Plans
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices yet"
                description="When members subscribe, their invoices appear here."
                className="rounded-none border-x-0 border-b-0"
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {recentInvoices.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 px-6 py-3 text-sm"
                  >
                    <Avatar className="h-7 w-7">
                      {i.user.image ? (
                        <AvatarImage src={i.user.image} alt={i.user.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initialsFor(i.user.name, i.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {i.user.name ?? i.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(i.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-xs",
                        i.status === "PAID" &&
                          "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
                        (i.status === "OPEN" || i.status === "UNCOLLECTIBLE") &&
                          "border-rose-500/40 text-rose-700 dark:text-rose-300",
                      )}
                    >
                      {i.status}
                    </Badge>
                    <span className="w-20 text-right font-medium">
                      {formatMoney(i.amountDueCents, i.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
