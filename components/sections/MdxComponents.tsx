import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/** Internal links in MDX get the current locale; external ones open in a new tab. */
function MdxLink({ href = "", children, ...rest }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return <Link href={href}>{children}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

export const mdxComponents = { a: MdxLink };
