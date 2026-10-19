import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:bg-primary/90 shadow-sm shadow-primary/20",
  secondary: "border border-line bg-surface text-ink hover:border-primary hover:text-primary",
  ghost: "text-ink hover:text-primary",
  light: "bg-white text-[#0a1a33] hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: "start" | "end";
  children: ReactNode;
  className?: string;
};

function Content({ icon, iconPosition = "end", children }: Pick<CommonProps, "icon" | "iconPosition" | "children">) {
  const iconEl = icon ? (
    <Icon
      name={icon}
      size={18}
      className={icon === "arrowRight" ? "rtl:-scale-x-100" : undefined}
    />
  ) : null;
  return (
    <>
      {iconPosition === "start" && iconEl}
      <span>{children}</span>
      {iconPosition === "end" && iconEl}
    </>
  );
}

/** Internal link styled as a button. Locale is added automatically. */
export function ButtonLink({
  href,
  variant,
  size,
  icon,
  iconPosition,
  children,
  className,
  ...rest
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </Link>
  );
}

/** External link (scheduling, WhatsApp, mailto) styled as a button. */
export function ButtonAnchor({
  href,
  variant,
  size,
  icon,
  iconPosition,
  children,
  className,
  external = true,
  newTabLabel,
}: CommonProps & { href: string; external?: boolean; newTabLabel?: string }) {
  return (
    <a
      href={href}
      className={buttonClasses(variant, size, className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
      {external && newTabLabel && <span className="sr-only"> {newTabLabel}</span>}
    </a>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconPosition,
  children,
  className,
  ...rest
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </button>
  );
}
