import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewClassForm } from "@/app/dashboard/classes/new/new-class-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { cn } from "@/lib/utils";

export const metadata = { title: "New class" };

export default async function NewClassPage() {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const coaches = await prisma.user.findMany({
    where: { gymId, role: { in: ["ADMIN", "COACH"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/dashboard/classes"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to schedule
      </Link>

      <PageHeader
        title="Add a recurring class"
        description="It'll repeat weekly until you remove it."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Class details</CardTitle>
          <CardDescription>
            Pick a day, start time, and (optionally) a coach. You can edit later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClassForm coaches={coaches} />
        </CardContent>
      </Card>
    </div>
  );
}
