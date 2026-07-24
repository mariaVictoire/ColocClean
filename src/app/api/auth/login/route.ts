import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
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

    const email = parsed.data.email.toLowerCase();

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error("[api/auth/login] database", error);
      return NextResponse.json(
        {
          error:
            "Base de données injoignable depuis Vercel. Vérifie DATABASE_URL (pooler session :5432).",
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

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
    } catch (error) {
      if (isNextRedirect(error)) {
        return NextResponse.json({ ok: true });
      }
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect.", code: "AUTH" },
          { status: 401 },
        );
      }
      console.error("[api/auth/login] signIn", error);
      return NextResponse.json(
        {
          error:
            "Impossible de créer la session. Vérifie AUTH_SECRET et AUTH_URL.",
          code: "SESSION",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/auth/login]", error);
    return NextResponse.json(
      { error: "Connexion impossible. Vérifie la configuration serveur.", code: "UNKNOWN" },
      { status: 500 },
    );
  }
}
