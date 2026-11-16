import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { GeoPattern } from "@/components/visual/GeoPattern";
import { cn } from "@/lib/cn";

/** The frame around the sign-in, sign-up and password pages: a heading, the form card and an optional side panel. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  aside,
  footer,
  wide,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <section aria-labelledby="page-title" className="relative overflow-clip">
      <GeoPattern className="text-silver/50 dark:text-silver/15" id="auth-geo" />
      <div aria-hidden="true" className="absolute -top-48 end-[-8rem] size-[30rem] glow [--glow:12%]" />
      <Container className="relative py-12 sm:py-20">
        <div className={cn("mx-auto grid gap-10", aside ? "max-w-6xl lg:grid-cols-[1.35fr_1fr] lg:items-start" : wide ? "max-w-2xl" : "max-w-md")}>
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 id="page-title" className="font-display text-balance mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="mt-3 text-muted sm:text-lg">{subtitle}</p>}
            <div className="relative mt-8 rounded-card border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
          {aside}
        </div>
      </Container>
    </section>
  );
}
