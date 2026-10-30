import { asset } from "@/lib/assets";
import { cn } from "@/lib/cn";

/** JTR emblem with the "Academy" wordmark, matching the website's logo. */
export function Logo({ className, size = 38 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size brand mark */}
      <img src={asset("/brand/jtr-emblem.png")} alt="" width={size} height={size} className="shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-[0.12em] text-ink">JTR</span>
        <span className="mt-1 text-[0.7rem] font-medium tracking-[0.18em] text-muted uppercase">Academy</span>
      </span>
    </span>
  );
}
