"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signActorAssertion } from "@/server/auth/identity-assertion";
import { authenticateAppUser, createAppUser, createFirstSuperAdmin, deleteAppUser, findAppUser, getClubAccessCode, saveClubAccessCode, setAppUserPassword, trainerQualificationSchema, updateAppUser, userRoleSchema } from "@/server/auth/identity-service";

const emailSchema = z.string().trim().toLowerCase().email();

export async function loginAction(formData: FormData): Promise<void> {
  const identityInput = String(formData.get("identity") ?? "").trim();
  const email = emailSchema.safeParse(identityInput);
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");
  const configuredCode = await getClubAccessCode();
  const user = password ? await authenticateAppUser(identityInput, password) : code === configuredCode ? await findAppUser(identityInput) : null;
  const actorEmail = user?.email ?? (email.success ? email.data : "");
  const secret = process.env.OCRCRAFT_ACTOR_ASSERTION_SECRET ?? configuredCode;
  if (!user || !actorEmail || !secret) redirect("/login?error=credentials");
  const issuedAt = Math.floor(Date.now() / 1000);
  const value = `${actorEmail}|${issuedAt}|${signActorAssertion(actorEmail, issuedAt, secret)}`;
  (await cookies()).set("ocrcraft-actor", value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete("ocrcraft-actor");
  redirect("/login?loggedOut=1");
}

export async function setupFirstSuperAdminAction(formData: FormData): Promise<void> {
  try {
    const user = await createFirstSuperAdmin({
      email: String(formData.get("email") ?? ""),
      username: String(formData.get("username") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      password: String(formData.get("password") ?? ""),
      clubAccessCode: String(formData.get("clubAccessCode") ?? ""),
    });
    const secret = process.env.OCRCRAFT_ACTOR_ASSERTION_SECRET ?? String(formData.get("clubAccessCode") ?? "").trim();
    const issuedAt = Math.floor(Date.now() / 1000);
    const value = `${user.email}|${issuedAt}|${signActorAssertion(user.email, issuedAt, secret)}`;
    (await cookies()).set("ocrcraft-actor", value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  } catch {
    redirect("/setup?error=invalid");
  }
  redirect("/");
}

export async function saveClubAccessCodeAction(formData: FormData): Promise<void> {
  try {
    await saveClubAccessCode(String(formData.get("clubAccessCode") ?? ""));
  } catch {
    redirect("/admin?tab=users&userError=access-code");
  }
  redirect("/admin?tab=users&userSaved=access-code");
}

export async function createUserAction(formData: FormData): Promise<void> {
  try {
    await createAppUser({
      email: String(formData.get("email") ?? ""),
      username: String(formData.get("username") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      role: userRoleSchema.parse(formData.get("role")),
      trainerQualificationLevel: trainerQualificationSchema.parse(formData.get("trainerQualificationLevel") ?? "none"),
      password: String(formData.get("password") ?? ""),
    });
  } catch {
    redirect("/admin?tab=users&userError=1");
  }
  redirect("/admin?tab=users&userSaved=1");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("id") ?? "");
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
      trainerQualificationLevel: trainerQualificationSchema.parse(formData.get("trainerQualificationLevel") ?? "none"),
      bio: String(formData.get("bio") ?? ""),
      specialties: String(formData.get("specialties") ?? ""),
      profileImageUri: String(formData.get("profileImageUri") ?? ""),
      profileImageData,
      profileImageContentType,
    });
  } catch (error) {
    const code = isAuthorizationError(error) ? "permission" : "invalid";
    const field = code === "invalid" ? validationField(error, formData) : undefined;
    const fieldQuery = field ? `&field=${encodeURIComponent(field)}` : "";
    redirect(`/admin/users/${encodeURIComponent(userId)}/edit?error=${code}${fieldQuery}`);
  }
  redirect(`/admin/users/${encodeURIComponent(userId)}/edit?saved=1`);
}

type UserEditField =
  | "id"
  | "email"
  | "role"
  | "username"
  | "firstName"
  | "lastName"
  | "education"
  | "trainerQualificationLevel"
  | "bio"
  | "specialties"
  | "profileImage"
  | "profileImageUri";

function isAuthorizationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("authorized") || error.message.includes("authenticated");
}

function validationField(error: unknown, formData: FormData): UserEditField | undefined {
  if (error instanceof z.ZodError) {
    const field = error.issues[0]?.path[0];
    if (typeof field === "string" && [
      "id", "email", "role", "username", "firstName", "lastName", "education",
      "trainerQualificationLevel", "bio", "specialties", "profileImageUri",
    ].includes(field)) return field as UserEditField;

    // Individual schemas are parsed by updateAppUser, so Zod reports an empty
    // path here. Re-run the same boundary checks against the submitted values
    // to retain the field association for the UI.
    const checks: readonly [UserEditField, () => boolean][] = [
      ["email", () => emailSchema.safeParse(formData.get("email")).success],
      ["firstName", () => z.string().trim().min(1).max(80).safeParse(formData.get("firstName")).success],
      ["lastName", () => z.string().trim().min(1).max(80).safeParse(formData.get("lastName")).success],
      ["username", () => z.string().trim().regex(/^[a-zA-Z0-9._-]{3,40}$/).safeParse(formData.get("username")).success],
      ["role", () => userRoleSchema.safeParse(formData.get("role")).success],
      ["education", () => z.string().trim().max(240).safeParse(formData.get("education")).success],
      ["trainerQualificationLevel", () => trainerQualificationSchema.safeParse(formData.get("trainerQualificationLevel")).success],
      ["bio", () => z.string().trim().max(1000).safeParse(formData.get("bio")).success],
      ["specialties", () => z.string().trim().max(500).safeParse(formData.get("specialties")).success],
      ["profileImageUri", () => z.string().trim().max(500).refine((value) => !value || /^(https?:\/\/|\/)/.test(value)).safeParse(formData.get("profileImageUri")).success],
    ];
    return checks.find(([, valid]) => !valid)?.[0];
  }
  if (error instanceof Error && error.message === "invalid-profile-image") return "profileImage";
  if (error instanceof Error && error.message.includes("Username is already in use")) return "username";
  if (error instanceof Error && error.message.includes("Email is already in use")) return "email";
  if (error instanceof Error && error.message.includes("profile image URI")) return "profileImageUri";
  return undefined;
}

export async function setUserPasswordAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("id") ?? "");
  try {
    await setAppUserPassword(String(formData.get("id") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    const code = isAuthorizationError(error) ? "permission" : "invalid";
    redirect(`/admin/users/${encodeURIComponent(userId)}/edit?error=${code}`);
  }
  redirect(`/admin/users/${encodeURIComponent(userId)}/edit?saved=password`);
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  try {
    await deleteAppUser(String(formData.get("id") ?? ""));
  } catch (error) {
    const code = isAuthorizationError(error) ? "permission" : "delete";
    redirect(`/admin?tab=users&userError=${code}`);
  }
  redirect("/admin?tab=users&userSaved=deleted");
}
