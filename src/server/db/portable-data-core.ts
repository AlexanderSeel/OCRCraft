import { z } from "zod";

export const portableSectionSchema = z.enum(["exercises", "details", "mapping", "trainings", "groups", "media", "provenance"]);
export type PortableSection = z.infer<typeof portableSectionSchema>;

export interface PortableExport {
  readonly schema: "ocrcraft-portable";
  readonly version: 1;
  readonly exportedAt: string;
  readonly sections: Partial<Record<PortableSection, Record<string, unknown>[]>>;
}

export const portableImportSchema = z.object({
  schema: z.literal("ocrcraft-portable"),
  version: z.literal(1),
  exportedAt: z.string().min(1),
  sections: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).superRefine((sections, context) => {
    for (const key of Object.keys(sections)) {
      if (!portableSectionSchema.safeParse(key).success) context.addIssue({ code: "custom", path: [key], message: "Unknown portable section" });
    }
  }),
});

export function parsePortableImport(value: unknown): { ok: true; data: PortableExport } | { ok: false; errors: readonly string[] } {
  const result = portableImportSchema.safeParse(value);
  if (result.success) return { ok: true, data: result.data as PortableExport };
  return { ok: false, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}
