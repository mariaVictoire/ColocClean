import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireOwner() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[requireOwner] auth() failed", error);
    redirect("/admin/connexion");
  }

  if (!session?.user?.email) {
    redirect("/admin/connexion");
  }

  const role = session.user.role;
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect("/admin/connexion");
  }

  return session;
}

export async function getOptionalSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
