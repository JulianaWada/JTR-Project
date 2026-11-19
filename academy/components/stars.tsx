import { cn } from "@/lib/cn";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** Five stars filled up to `value` (fractions show part of a star), in JTR yellow. */
export function Stars({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label ?? `${value.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block size-[1em]">
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-full text-line" aria-hidden>
              <path d={STAR} fill="currentColor" />
            </svg>
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg viewBox="0 0 24 24" className="size-[1em] text-gold" aria-hidden>
                  <path d={STAR} fill="currentColor" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export { STAR as STAR_PATH };
