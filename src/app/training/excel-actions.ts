"use server";

import { redirect } from "next/navigation";
import { requireTrainer } from "@/server/auth/identity-service";
import { importTrainingWorkbook } from "@/server/training/training-excel-service";

export async function importTrainingExcelAction(formData: FormData): Promise<void> {
  await requireTrainer();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) redirect("/training?excelError=missing");
  if (!file.name.toLocaleLowerCase("de-DE").endsWith(".xlsx")) redirect("/training?excelError=format");
  try {
    const result = await importTrainingWorkbook(new Uint8Array(await file.arrayBuffer()), title);
    redirect(`/training/${result.sessionId}?saved=excel-import`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Excel-Import fehlgeschlagen.";
    redirect(`/training?excelError=${encodeURIComponent(message.slice(0, 300))}`);
  }
}
