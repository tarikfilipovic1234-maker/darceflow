import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewTechniqueForm } from "@/app/dashboard/library/new/new-technique-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/db/scoped";
import { cn } from "@/lib/utils";

export const metadata = { title: "Add technique" };

export default async function NewTechniquePage() {
  await requireRole(["ADMIN", "COACH"]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/library"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <PageHeader
        title="Add a technique"
        description="Paste a YouTube, Vimeo, or direct video link. Vercel Blob uploads land in a follow-up."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Technique details</CardTitle>
          <CardDescription>
            Pick the position and category so people can find it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewTechniqueForm />
        </CardContent>
      </Card>
    </div>
  );
}
