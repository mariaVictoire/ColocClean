import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthPage =
    pathname.startsWith("/admin/connexion") ||
    pathname.startsWith("/admin/mot-de-passe-oublie");

  const isAdminRoute = pathname.startsWith("/admin") && !isAuthPage;

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
});

export const config = {
  matcher: ["/admin/:path*"],
};
