import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { ServiceGrid } from "@/components/sections/ServiceGrid";
import { WhyJTR } from "@/components/sections/WhyJTR";
import { GlobalReach } from "@/components/sections/GlobalReach";
import { MissionVision } from "@/components/sections/MissionVision";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { CTABand } from "@/components/sections/CTABand";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  return pageMetadata({ locale, path: "" });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <ServiceGrid />
      <WhyJTR />
      <GlobalReach />
      <MissionVision />
      <FeaturedProjects />
      <CTABand />
    </>
  );
}
