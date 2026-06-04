import Link from "next/link";
import { ArrowLeft, Archive, CreditCard, Plus } from "lucide-react";

import { archivePlanAction } from "@/app/dashboard/billing/actions";
import { PlanCard } from "@/components/billing/plan-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { cn } from "@/lib/utils";

export const metadata = { title: "Plans" };

export default async function PlansPage() {
  await requireRole(["ADMIN"]);
  const { gymId } = await requireGymId();

  const plans = await prisma.plan.findMany({
    where: { gymId, archived: false },
    orderBy: { amountCents: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard/admin/billing"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </Link>

      <PageHeader
        title="Membership plans"
        description="Create the plans your members can subscribe to."
        actions={
          <Link
            href="/dashboard/admin/billing/plans/new"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="h-4 w-4" />
            New plan
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No plans yet"
          description="Add a plan to start selling memberships. If Stripe is configured, the Product + Price are created in Stripe automatically."
          action={
            <Link
              href="/dashboard/admin/billing/plans/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Create your first plan
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              action={
                <form action={archivePlanAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </Button>
                </form>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
