import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-primary uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-0.5 w-6 -skew-x-[30deg] bg-primary" />
      {children}
    </p>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "start",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag
        id={id}
        className={cn(
          "font-display text-balance mt-3 font-semibold tracking-tight text-ink",
          Tag === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl",
        )}
      >
        {title}
      </Tag>
      {subtitle && <p className="mt-4 text-lg text-muted text-balance">{subtitle}</p>}
    </div>
  );
}
