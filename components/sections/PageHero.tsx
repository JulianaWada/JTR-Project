import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { GeoPattern } from "@/components/visual/GeoPattern";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="page-title" className="relative overflow-hidden border-b border-line">
      <GeoPattern className="text-silver/50 dark:text-silver/15" id="page-geo" />
      <div aria-hidden="true" className="absolute -top-48 end-[-8rem] size-[30rem] rounded-full bg-primary/12 blur-3xl" />
      <Container className="relative py-16 sm:py-24">
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 id="page-title" className="font-display text-balance mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-5 text-lg text-muted sm:text-xl">{subtitle}</p>}
          {children}
        </div>
      </Container>
    </section>
  );
}
