import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, files with an extension, the admin board (English only) and JTR Academy
  // (a separate app under /academy, see next.config.ts). /academy/interest is a page of this site.
  matcher: "/((?!api|admin|_next|_vercel|academy$|academy/(?!interest(?:/|$))|.*\\..*).*)",
};
