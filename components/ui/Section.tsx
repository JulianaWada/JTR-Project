import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type Tone = "default" | "surface" | "navy";

const tones: Record<Tone, string> = {
  default: "",
  surface: "bg-surface",
  // The navy band stays dark in both themes, so text inside uses fixed light colours.
  navy: "dark bg-navy text-ink",
};

export function Section({
  children,
  id,
  tone = "default",
  className,
  containerClassName,
  labelledBy,
}: {
  children: ReactNode;
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-16 sm:py-24", tones[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
