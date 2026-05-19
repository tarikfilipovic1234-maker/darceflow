import { CalendarClock, CreditCard, LineChart, ShieldCheck, Trophy, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: LineChart,
    title: "Attendance & streaks",
    description:
      "Check-in flow that updates streaks in real time and surfaces who needs a nudge before they ghost.",
  },
  {
    icon: Trophy,
    title: "Belt progression",
    description:
      "Track stripes, promotions, and competition records. Coaches award belts in two clicks; the timeline writes itself.",
  },
  {
    icon: CalendarClock,
    title: "Class scheduling",
    description:
      "Recurring classes, reservations, and waitlists. Auto-promote from the waitlist the moment a spot opens.",
  },
  {
    icon: CreditCard,
    title: "Stripe-powered billing",
    description:
      "Memberships, invoices, and failed-payment recovery handled by Stripe — your bank account just gets fuller.",
  },
  {
    icon: Users,
    title: "Multi-tenant by default",
    description:
      "Run one academy or fifty. Every gym is isolated, every coach sees only their roster, every student stays in their lane.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Admin, coach, and student permissions baked into every route. Built so a curious student can't promote themselves.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Everything you need
        </span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          The boring parts of running a gym, finally automated.
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          One platform for memberships, mat time, belt journeys, and class bookings — so you
          can spend less time on the laptop and more time on the mat.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="border-border/70 bg-card/60 transition-colors hover:border-border"
          >
            <CardHeader>
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border/70 bg-background/60">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-4 text-base font-semibold">{title}</CardTitle>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </section>
  );
}
