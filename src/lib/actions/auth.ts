"use server";

import { redirect } from "next/navigation";
import { destroyAppSession } from "@/lib/session";

export async function signOutAction() {
  await destroyAppSession();
  redirect("/admin/connexion");
}
