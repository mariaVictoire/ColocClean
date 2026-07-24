import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { appConfig } from "@/config/app";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? `__Secure-${appConfig.slug}.session-token`
    : `${appConfig.slug}.session-token`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Identifiants invalides.", code: "VALIDATION" },
        { status: 400 },
      );
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "AUTH_SECRET manquant sur le serveur.", code: "SECRET" },
        { status: 500 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error("[api/auth/login] database", error);
      return NextResponse.json(
        {
          error: "Base de données injoignable. Vérifie DATABASE_URL.",
          code: "DB",
        },
        { status: 503 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect.", code: "CREDENTIALS" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect.", code: "CREDENTIALS" },
        { status: 401 },
      );
    }

    const cookieName = sessionCookieName();
    const token = await encode({
      secret,
      salt: cookieName,
      maxAge: SESSION_MAX_AGE,
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[api/auth/login]", error);
    return NextResponse.json(
      {
        error: "Connexion impossible. Vérifie la configuration serveur.",
        code: "UNKNOWN",
      },
      { status: 500 },
    );
  }
}
