"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { createAppSession } from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Identifiants invalides." };
  }

  if (!process.env.AUTH_SECRET) {
    return { error: "AUTH_SECRET manquant sur Vercel." };
  }

  const email = parsed.data.email.toLowerCase();

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error("[loginAction] db", error);
    return {
      error:
        "Base de données injoignable. Vérifie DATABASE_URL (pooler :5432).",
    };
  }

  if (!user) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Email ou mot de passe incorrect." };
  }

  try {
    await createAppSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("[loginAction] session", error);
    return { error: "Impossible de créer la session (AUTH_SECRET ?)." };
  }

  redirect("/admin");
}
