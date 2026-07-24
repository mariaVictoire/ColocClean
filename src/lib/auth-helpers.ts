import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireOwner() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/connexion");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/admin/connexion");
  }
  return session;
}

export async function getOptionalSession() {
  return auth();
}
