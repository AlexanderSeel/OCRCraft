"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { UiDictionary } from "@/i18n/dictionaries";
import { formControlClass } from "@/components/ui/form";

export function MediaWorkflowCopy({ name }: { readonly name: keyof UiDictionary["mediaWorkflow"] }) {
  const { dictionary } = useLocale();
  return dictionary.mediaWorkflow[name];
}

export function MediaSearchInput({ value, missing = false }: { readonly value: string; readonly missing?: boolean }) {
  const { dictionary } = useLocale();
  return <input className={formControlClass} defaultValue={value} name={missing ? "missingQ" : "q"} placeholder={missing ? dictionary.mediaWorkflow.missingSearch : dictionary.mediaWorkflow.search} />;
}

export function MediaBatchError({ code }: { readonly code: string }) {
  return <MediaWorkflowCopy name={code === "selection" ? "selectionError" : code === "config" ? "configError" : code === "action" ? "actionError" : "failedError"} />;
}
