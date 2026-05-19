import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { MatHoursPreview } from "@/components/marketing/mat-hours-preview";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_55%,transparent)_1px,transparent_0)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:pt-32">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Built for jiu-jitsu academies</span>
        </span>

        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Run your BJJ academy
          <span className="block bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent">
            on autopilot.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Memberships, attendance, belt progression, and class scheduling — in one tidy
          dashboard that looks as sharp as the academy that runs it.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
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
            View live demo
          </Link>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          No credit card required · From white belt to black belt
        </p>

        <div className="mt-14 w-full max-w-3xl">
          <MatHoursPreview />
        </div>
      </div>
    </section>
  );
}
