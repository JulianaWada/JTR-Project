"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* reducedMotion="user" turns animations off for visitors who ask for less motion. */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          {children}
        </LazyMotion>
      </MotionConfig>
    </ThemeProvider>
  );
}
