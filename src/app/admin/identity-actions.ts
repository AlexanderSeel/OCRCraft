"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signActorAssertion } from "@/server/auth/identity-assertion";
import { authenticateAppUser, createAppUser, updateAppUser, userRoleSchema } from "@/server/auth/identity-service";

const emailSchema = z.string().trim().toLowerCase().email();

export async function loginAction(formData: FormData): Promise<void> {
  const identityInput = String(formData.get("identity") ?? "").trim();
  const email = emailSchema.safeParse(identityInput);
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");
  const secret = process.env.OCRCRAFT_ACTOR_ASSERTION_SECRET;
  if (!identityInput || !secret) redirect("/admin?tab=users&loginError=1");
  const user = password ? await authenticateAppUser(identityInput, password) : null;
  const codeValid = Boolean(process.env.OCRCRAFT_LOGIN_CODE && code === process.env.OCRCRAFT_LOGIN_CODE);
  if (!user && !codeValid) redirect("/admin?tab=users&loginError=1");
  const actorEmail = user?.email ?? (email.success ? email.data : "");
  if (!actorEmail) redirect("/admin?tab=users&loginError=1");
  const value = `${actorEmail}|${Math.floor(Date.now() / 1000)}|${signActorAssertion(actorEmail, Math.floor(Date.now() / 1000), secret)}`;
  (await cookies()).set("ocrcraft-actor", value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  redirect("/admin?tab=users&loggedIn=1");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete("ocrcraft-actor");
  redirect("/admin?tab=users&loggedOut=1");
}

export async function createUserAction(formData: FormData): Promise<void> {
  try {
    await createAppUser({ email: String(formData.get("email") ?? ""), username: String(formData.get("username") ?? ""), firstName: String(formData.get("firstName") ?? ""), lastName: String(formData.get("lastName") ?? ""), role: userRoleSchema.parse(formData.get("role")), password: String(formData.get("password") ?? "") });
  } catch {
    redirect("/admin?tab=users&userError=1");
  }
  redirect("/admin?tab=users&userSaved=1");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  try {
    const image = formData.get("profileImage");
    let profileImageData: string | undefined;
    let profileImageContentType: string | undefined;
    if (image instanceof File && image.size > 0) {
      if (image.size > 2 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("invalid-profile-image");
      profileImageData = Buffer.from(await image.arrayBuffer()).toString("base64");
      profileImageContentType = image.type;
    }
    await updateAppUser({
      id: String(formData.get("id") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: userRoleSchema.parse(formData.get("role")),
      active: formData.get("active") === "on",
      username: String(formData.get("username") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      education: String(formData.get("education") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      specialties: String(formData.get("specialties") ?? ""),
      profileImageUri: String(formData.get("profileImageUri") ?? ""),
      profileImageData,
      profileImageContentType,
    });
  } catch {
    redirect("/admin?tab=users&userError=1");
  }
  redirect("/admin?tab=users&userSaved=1");
}
