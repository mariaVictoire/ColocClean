import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appConfig } from "@/config/app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/admin/connexion") ||
    pathname.startsWith("/admin/mot-de-passe-oublie");

  if (isAuthPage) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const secure = `__Secure-${appConfig.slug}.session-token`;
  const plain = `${appConfig.slug}.session-token`;
  const hasSession = Boolean(
    req.cookies.get(secure)?.value || req.cookies.get(plain)?.value,
  );

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
