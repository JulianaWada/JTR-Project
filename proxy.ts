import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/**
 * The admin board's own subdomain, e.g. admin.julestechright.com (optional). The board stays at /admin in this app;
 * when ADMIN_HOST is set, that host opens the board and /admin on the other addresses redirects there.
 */
function adminHost() {
  return process.env.ADMIN_HOST?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || undefined;
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];
  const admin = adminHost();

  if (admin && host === admin) {
    // The admin subdomain shows only the board.
    if (isAdminPath(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminPath(pathname)) {
    if (admin) return NextResponse.redirect(`https://${admin}${pathname}${search}`);
    // The admin board is English only and has no locale prefix.
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  // Everything except API routes, Next internals, files with an extension and JTR Academy (a separate app under
  // /academy, see next.config.ts). /academy/interest is a page of this site.
  matcher: "/((?!api|_next|_vercel|academy$|academy/(?!interest(?:/|$))|.*\\..*).*)",
};
