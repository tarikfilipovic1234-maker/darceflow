import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewPlanForm } from "@/app/dashboard/admin/billing/plans/new/new-plan-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/db/scoped";
import { isStripeConfigured } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const metadata = { title: "New plan" };

export default async function NewPlanPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/dashboard/admin/billing/plans"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plans
      </Link>

      <PageHeader
        title="New plan"
        description={
          isStripeConfigured()
            ? "Saving creates a Product + Price in Stripe so members can subscribe via Checkout."
            : "Stripe isn't configured, so this plan will be local-only until you add Stripe keys."
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Plan details</CardTitle>
          <CardDescription>
            Pricing in cents — $20/mo is 2000. Features go one per line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewPlanForm />
        </CardContent>
      </Card>
    </div>
  );
}
