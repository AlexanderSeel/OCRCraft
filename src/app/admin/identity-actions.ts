"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signActorAssertion } from "@/server/auth/identity-assertion";
import { authenticateAppUser, createAppUser, updateAppUser, userRoleSchema } from "@/server/auth/identity-service";

const emailSchema = z.string().trim().toLowerCase().email();

export async function loginAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");
  const secret = process.env.OCRCRAFT_ACTOR_ASSERTION_SECRET;
  if (!email.success || !secret) redirect("/admin?tab=settings&loginError=1#identity");
  const user = password ? await authenticateAppUser(email.data, password) : null;
  const codeValid = Boolean(process.env.OCRCRAFT_LOGIN_CODE && code === process.env.OCRCRAFT_LOGIN_CODE);
  if (!user && !codeValid) redirect("/admin?tab=settings&loginError=1#identity");
  const value = `${email.data}|${Math.floor(Date.now() / 1000)}|${signActorAssertion(email.data, Math.floor(Date.now() / 1000), secret)}`;
  (await cookies()).set("ocrcraft-actor", value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  redirect("/admin?tab=settings&loggedIn=1#identity");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete("ocrcraft-actor");
  redirect("/admin?tab=settings&loggedOut=1#identity");
}

export async function createUserAction(formData: FormData): Promise<void> {
  try {
    await createAppUser({ email: String(formData.get("email") ?? ""), displayName: String(formData.get("displayName") ?? ""), role: userRoleSchema.parse(formData.get("role")), password: String(formData.get("password") ?? "") });
  } catch {
    redirect("/admin?tab=settings&userError=1#identity");
  }
  redirect("/admin?tab=settings&userSaved=1#identity");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  try {
    await updateAppUser({
      id: String(formData.get("id") ?? ""),
      role: userRoleSchema.parse(formData.get("role")),
      active: formData.get("active") === "on",
      displayName: String(formData.get("displayName") ?? ""),
      education: String(formData.get("education") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      specialties: String(formData.get("specialties") ?? ""),
      profileImageUri: String(formData.get("profileImageUri") ?? ""),
    });
  } catch {
    redirect("/admin?tab=settings&userError=1#identity");
  }
  redirect("/admin?tab=settings&userSaved=1#identity");
}
