import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 400 },
      );
    }

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    // Auth.js / Next peuvent wrapper l'erreur
    const type =
      error && typeof error === "object" && "type" in error
        ? String((error as { type?: string }).type)
        : null;
    if (type === "CredentialsSignin" || type === "CallbackRouteError") {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    console.error("[api/auth/login]", error);
    return NextResponse.json(
      { error: "Connexion impossible. Vérifie la configuration serveur." },
      { status: 500 },
    );
  }
}
