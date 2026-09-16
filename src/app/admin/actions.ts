"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { reseedAllDatabaseData } from "@/server/db/reseed-service";

const reseedConfirmationSchema = z.literal("OCRCRAFT ZURÜCKSETZEN");

export async function reseedDatabaseAction(formData: FormData): Promise<void> {
  const confirmation = reseedConfirmationSchema.safeParse(
    String(formData.get("confirmation") ?? ""),
  );

  if (!confirmation.success) {
    redirect("/admin?reseedError=confirmation#database-settings");
  }

  try {
    await ensureDatabaseReady();
    await reseedAllDatabaseData();
  } catch {
    redirect("/admin?reseedError=failed#database-settings");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/exercises");
  redirect("/admin?reseeded=1#database-settings");
}
