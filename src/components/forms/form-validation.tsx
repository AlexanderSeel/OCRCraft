"use client";

import { useEffect } from "react";

const errorAttribute = "data-field-error";
let errorSequence = 0;

export function FormValidation() {
  useEffect(() => {
    const firstInvalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    firstInvalidField?.focus();

    const onInvalid = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      field.setAttribute("aria-invalid", "true");
      const label = field.closest("label") ?? field.parentElement;
      if (!label || label.querySelector(`[${errorAttribute}]`)) return;
      const message = document.createElement("span");
      message.setAttribute(errorAttribute, "true");
      message.className = "field-error";
      message.id = `${field.name || "field"}-error-${++errorSequence}`;
      message.textContent = field.validity.valueMissing
        ? "Dieses Pflichtfeld ist erforderlich."
        : field.validity.badInput
          ? "Bitte eine gültige Zahl eingeben."
        : field.validity.typeMismatch
          ? "Bitte ein gültiges E-Mail- oder URL-Format eingeben."
          : field.validity.patternMismatch
            ? "Bitte das erwartete Format verwenden."
          : field.validity.rangeUnderflow || field.validity.rangeOverflow
            ? "Der Wert liegt außerhalb des erlaubten Bereichs."
            : field.validity.stepMismatch
              ? "Bitte einen zulässigen Schrittwert eingeben."
            : field.validity.tooShort || field.validity.tooLong
              ? "Die Eingabe hat eine ungültige Länge."
              : "Bitte Eingabe prüfen.";
      label.append(message);
      const describedBy = field.getAttribute("aria-describedby");
      if (describedBy) field.dataset.validationDescribedby = describedBy;
      field.setAttribute("aria-describedby", describedBy ? `${describedBy} ${message.id}` : message.id);
    };
    const onInput = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (field.validity.valid) {
        field.removeAttribute("aria-invalid");
        (field.closest("label") ?? field.parentElement)?.querySelector(`[${errorAttribute}]`)?.remove();
        const originalDescribedBy = field.dataset.validationDescribedby;
        if (originalDescribedBy) {
          field.setAttribute("aria-describedby", originalDescribedBy);
          delete field.dataset.validationDescribedby;
        } else {
          field.removeAttribute("aria-describedby");
        }
      }
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
    };
  }, []);
  return null;
}
