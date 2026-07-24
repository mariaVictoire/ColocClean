import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Ne fait que protéger /admin/* (hors pages auth).
 * Ne renvoie PAS vers /admin depuis la page connexion (évite ERR_TOO_MANY_REDIRECTS
 * quand un cookie est présent mais non décodable par auth()).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/admin/connexion") ||
    pathname.startsWith("/admin/mot-de-passe-oublie");

  if (isAuthPage) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const hasSession =
    Boolean(req.cookies.get("__Secure-authjs.session-token")?.value) ||
    Boolean(req.cookies.get("authjs.session-token")?.value) ||
    Boolean(req.cookies.get("__Secure-coloclean.session-token")?.value) ||
    Boolean(req.cookies.get("coloclean.session-token")?.value);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
