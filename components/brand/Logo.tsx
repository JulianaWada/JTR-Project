import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * JTR emblem + wordmark. The emblem is /public/brand/jtr-emblem.png ("LTD" removed, per brand guidance).
 * TODO: when a vector logo is ready, save it as /public/brand/jtr-emblem.svg and point `src` at it.
 */
export function Logo({
  alt,
  className,
  showWordmark = true,
  size = 40,
}: {
  alt: string;
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/brand/jtr-emblem.png"
        alt={showWordmark ? "" : alt}
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {showWordmark && (
        <span className="flex flex-col leading-none" dir="ltr">
          <span className="font-display text-xl font-bold tracking-[0.12em] text-ink">JTR</span>
          <span className="mt-1 text-[0.7rem] font-medium tracking-[0.18em] text-muted uppercase">
            Jules TechRight
          </span>
        </span>
      )}
    </span>
  );
}
