import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getDictionary, type Locale } from "@/i18n/dictionaries";
import { TrainingValidationSummary } from "./training-validation-summary";
import type { TrainingValidationIssue } from "@/domain/training/validation";

let locale: Locale = "de";
vi.mock("@/components/i18n/locale-provider", () => ({ useLocale: () => ({ dictionary: getDictionary(locale) }) }));
const issue = (severity: "error" | "warning", message: string): TrainingValidationIssue => ({ code: "age-restricted", severity, message });
function render(issues: readonly TrainingValidationIssue[] = [], warnings: readonly string[] = []) {
  return renderToStaticMarkup(createElement(TrainingValidationSummary, { issues, warnings }));
}

describe("training validation summary", () => {
  it("announces blockers separately from recommendations and counts both sources of warnings", () => {
    locale = "de";
    const html = render([issue("error", "Altersgrenze verletzt"), issue("warning", "Mehr Wechselzeit")], ["Technik zuerst"]);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Fehler: 1 · Hinweise: 2");
    expect(html).toContain("Vor dem Speichern beheben");
    const [errors, notes] = html.split('aria-label="Planungshinweise und Empfehlungen"');
    expect(errors).toContain("Altersgrenze verletzt");
    expect(errors).not.toContain("Mehr Wechselzeit");
    expect(notes).toContain("Mehr Wechselzeit");
    expect(notes).toContain("Technik zuerst");
    expect(notes).not.toContain("Altersgrenze verletzt");
  });
  it("does not show success when only composer warnings exist", () => {
    const html = render([], ["Equipment prüfen"]);
    expect(html).toContain("var(--warning)");
    expect(html).toContain("Fehler: 0 · Hinweise: 1");
    expect(html).not.toContain("var(--success");
    expect(html).not.toContain("Vor dem Speichern beheben");
  });
  it("shows success only for a check without issues or warnings", () => {
    expect(render()).toContain("Plan-Check ohne Hinweise");
    expect(render()).toContain("var(--success");
    expect(render()).not.toContain("<section");
  });
  it("renders translated counts and blockers in English", () => {
    locale = "en";
    const html = render([issue("error", "Age restriction")]);
    expect(html).toContain("Errors: 1 · Notes: 0");
    expect(html).toContain("Resolve before saving");
    locale = "de";
  });
});
