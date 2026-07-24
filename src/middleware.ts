import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appConfig } from "@/config/app";

/**
 * Middleware Edge-safe (sans NextAuth) :
 * Auth.js en middleware provoquait MIDDLEWARE_INVOCATION_FAILED sur Vercel.
 * La vraie vérif JWT reste côté serveur via requireOwner() / auth().
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/admin/connexion") ||
    pathname.startsWith("/admin/mot-de-passe-oublie");
  const isAdminRoute = pathname.startsWith("/admin") && !isAuthPage;

  const secureName = `__Secure-${appConfig.slug}.session-token`;
  const devName = `${appConfig.slug}.session-token`;
  const isLoggedIn = Boolean(
    req.cookies.get(secureName)?.value || req.cookies.get(devName)?.value,
  );

  if (isAdminRoute && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
