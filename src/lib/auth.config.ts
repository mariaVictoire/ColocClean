import type { NextAuthConfig } from "next-auth";

/**
 * Config Auth compatible Edge.
 * Cookies = noms Auth.js v5 par défaut (authjs.*).
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
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      if (!token.role) {
        token.role = "OWNER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string) ?? "";
        session.user.role = (token.role as string) ?? "OWNER";
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
