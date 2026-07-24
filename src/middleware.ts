import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware minimal : pas de redirection depuis /connexion.
 * La session réelle est vérifiée dans requireOwner() (server).
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
