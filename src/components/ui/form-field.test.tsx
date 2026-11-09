import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { FormField } from "./form-field";

vi.mock("@/components/i18n/locale-provider", () => ({ useLocale: () => ({ dictionary: getDictionary("de") }) }));

it("keeps the label separate from help and merges existing descriptions with hint and error IDs", () => {
  const html = renderToStaticMarkup(<FormField label="Testfeld" hint="Hilfetext" error="Fehlertext"><input id="existing-control" aria-describedby="existing-description" /></FormField>);
  expect(html).toContain('<label for="existing-control">Testfeld</label>');
  const input = html.match(/<input[^>]+>/)?.[0];
  expect(input).toContain('id="existing-control"');
  expect(input).toContain('aria-invalid="true"');
  const descriptions = input?.match(/aria-describedby="([^"]+)"/)?.[1].split(" ");
  expect(descriptions).toHaveLength(3);
  expect(descriptions?.[0]).toBe("existing-description");
  expect(html).toContain(`id="${descriptions?.[1]}"`);
  expect(html).toContain(`id="${descriptions?.[2]}" role="alert"`);
  expect(html).toContain('type="button"');
});

it("preserves a caller's invalid state and does not create empty descriptions", () => {
  const html = renderToStaticMarkup(<FormField label="Testfeld"><select aria-invalid="grammar" /></FormField>);
  expect(html).toContain('aria-invalid="grammar"');
  expect(html).not.toContain("aria-describedby");
  expect(html).not.toContain('role="alert"');
});
