import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";

export async function requireOwner() {
  const session = await getAppSession();

  if (!session?.user?.email) {
    redirect("/admin/connexion");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/admin/connexion");
  }

  return session;
}

export async function getOptionalSession() {
  return getAppSession();
}
