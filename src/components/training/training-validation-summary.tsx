"use client";

import * as React from "react";
import { presentPlanningMessage } from "./training-note-presentation";
import type { TrainingValidationIssue } from "@/domain/training/validation";
import { useLocale } from "@/components/i18n/locale-provider";
import { Alert } from "@/components/ui/feedback";

export function TrainingValidationSummary({ issues, warnings }: {
  readonly issues: readonly TrainingValidationIssue[];
  readonly warnings: readonly string[];
}) {
  const { dictionary, locale } = useLocale();
  const copy = dictionary.trainingValidation;
  const errors = issues.filter((issue) => issue.severity === "error");
  const recommendations = [...issues.filter((issue) => issue.severity === "warning").map((issue) => issue.message), ...warnings].map((message) => presentPlanningMessage(message, locale));
  const tone = errors.length > 0 ? "danger" : recommendations.length > 0 ? "warning" : "success";

  return <div className="space-y-3" data-testid="training-validation-summary">
    <Alert tone={tone}>
      {errors.length === 0 && recommendations.length === 0
        ? copy.clear
        : `${copy.errors}: ${errors.length} · ${copy.warnings}: ${recommendations.length}`}
      {errors.length > 0 ? <div className="mt-1">{copy.blocked}</div> : null}
    </Alert>
    {errors.length > 0 ? <section aria-label={copy.errors} className="rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">
      <h5 className="font-black">{copy.errors}</h5>
      <ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
    </section> : null}
    {recommendations.length > 0 ? <section aria-label={copy.recommendations} className="rounded-md border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
      <h5 className="font-black">{copy.recommendations}</h5>
      <ul className="mt-2 list-disc space-y-1 pl-5">{recommendations.map((message, index) => <li key={index}>{message}</li>)}</ul>
    </section> : null}
  </div>;
}
