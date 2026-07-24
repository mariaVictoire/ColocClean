import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";
import { appConfig } from "@/config/app";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AppSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

export type AppSession = {
  user: AppSessionUser;
};

function cookieName() {
  return process.env.NODE_ENV === "production"
    ? `__Secure-${appConfig.slug}.session-token`
    : `${appConfig.slug}.session-token`;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant");
  }
  return secret;
}

export async function createAppSession(user: AppSessionUser) {
  const name = cookieName();
  const secret = getSecret();
  const token = await encode({
    secret,
    salt: name,
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
    },
  });

  const jar = await cookies();
  jar.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroyAppSession() {
  const jar = await cookies();
  const name = cookieName();
  jar.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getAppSession(): Promise<AppSession | null> {
  try {
    const jar = await cookies();
    const name = cookieName();
    const value = jar.get(name)?.value;
    if (!value) return null;

    const token = await decode({
      token: value,
      secret: getSecret(),
      salt: name,
    });

    if (!token) return null;

    const id = (token.id as string | undefined) ?? token.sub;
    const email = token.email;
    const role = (token.role as string | undefined) ?? "OWNER";

    if (!id || typeof email !== "string") return null;

    return {
      user: {
        id,
        email,
        name: (token.name as string | null | undefined) ?? null,
        role,
      },
    };
  } catch (error) {
    console.error("[getAppSession]", error);
    return null;
  }
}
