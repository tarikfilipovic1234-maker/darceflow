import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InviteMemberForm } from "@/app/dashboard/members/new/invite-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/db/scoped";
import { cn } from "@/lib/utils";

export const metadata = { title: "Invite member" };

export default async function NewMemberPage() {
  const session = await requireRole(["ADMIN", "COACH"]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/dashboard/members"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 gap-1.5 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to members
      </Link>

      <PageHeader
        title="Invite a member"
        description={
          session.user.role === "COACH"
            ? "Add a student to your gym. They'll sign in with the temporary password you share."
            : "Add a coach, student, or another admin to your gym."
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Member details</CardTitle>
          <CardDescription>
            They&apos;ll use the temporary password to sign in. Tell them to change it after.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm canInviteAdmins={session.user.role === "ADMIN"} />
        </CardContent>
      </Card>
    </div>
  );
}
