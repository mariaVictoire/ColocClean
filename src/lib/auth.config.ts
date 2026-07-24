import type { NextAuthConfig } from "next-auth";
import { appConfig } from "@/config/app";

/**
 * Config Auth compatible Edge (middleware).
 * Les providers Credentials (Prisma/bcrypt) restent dans auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/admin/connexion",
    error: "/admin/connexion",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPage =
        pathname.startsWith("/admin/connexion") ||
        pathname.startsWith("/admin/mot-de-passe-oublie");
      const isAdminRoute = pathname.startsWith("/admin") && !isAuthPage;

      if (isAdminRoute) {
        return !!auth?.user;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role ?? "OWNER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-${appConfig.slug}.session-token`
          : `${appConfig.slug}.session-token`,
    },
  },
} satisfies NextAuthConfig;
