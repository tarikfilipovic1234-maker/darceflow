import { BeltShowcase } from "@/components/marketing/belt-showcase";
import { CtaStrip } from "@/components/marketing/cta-strip";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { StatsStrip } from "@/components/marketing/stats-strip";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <FeatureGrid />
      <BeltShowcase />
      <CtaStrip />
    </>
  );
}
