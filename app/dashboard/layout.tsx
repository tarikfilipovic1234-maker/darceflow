import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/db/scoped";
import { isPastDue } from "@/lib/billing";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const [gym, pastDue] = await Promise.all([
    session.user.gymId
      ? prisma.gym.findUnique({
          where: { id: session.user.gymId },
          select: { name: true },
        })
      : Promise.resolve(null),
    isPastDue(session.user.id),
  ]);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border/60 bg-muted/30 lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-border/60 px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav role={session.user.role} />
        </div>
        <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
          {gym?.name ?? "No gym assigned"}
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
              role={session.user.role}
              gymName={gym?.name ?? null}
            />
          </div>
        </header>
        {pastDue ? (
          <Link
            href="/dashboard/billing"
            className="border-b border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-900 transition-colors hover:bg-rose-500/15 dark:text-rose-200 sm:px-6 lg:px-10"
          >
            <span className="inline-flex items-center gap-2">
              <CircleAlert className="h-4 w-4" />
              <span>
                Your last membership payment failed. Update your card to keep training →
              </span>
            </span>
          </Link>
        ) : null}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
