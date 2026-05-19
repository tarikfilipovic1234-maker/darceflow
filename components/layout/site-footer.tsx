import Link from "next/link";

import { Brand } from "@/components/layout/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-col gap-2">
          <Brand />
          <p className="text-sm text-muted-foreground">
            Gym management built for jiu-jitsu.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:items-end">
          <span>&copy; {new Date().getFullYear()} darceflow</span>
          <Link
            href="https://github.com"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
