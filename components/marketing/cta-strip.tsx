import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background to-muted/60 px-8 py-14 text-center shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_65%,transparent)_1px,transparent_0)] bg-[size:20px_20px]"
        />
        <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Spend less time on the laptop. More time on the mat.
        </h2>
        <p className="relative mx-auto mt-3 max-w-lg text-muted-foreground">
          Set up your academy in a few minutes. Bring your members across whenever you&apos;re
          ready.
        </p>
        <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "group")}
          >
            Start free trial
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
