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
      if (!label || field.dataset.validationErrorId) return;
      const message = document.createElement("span");
      message.setAttribute(errorAttribute, "true");
      message.setAttribute("role", "alert");
      message.setAttribute("aria-live", "polite");
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
      field.dataset.validationErrorId = message.id;
      const describedBy = field.getAttribute("aria-describedby");
      field.setAttribute("aria-describedby", describedBy ? `${describedBy} ${message.id}` : message.id);
    };
    const onInput = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      const errorId = field.dataset.validationErrorId;
      if (field.validity.valid && errorId) {
        field.removeAttribute("aria-invalid");
        document.getElementById(errorId)?.remove();
        const remainingDescriptions = (field.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== errorId);
        if (remainingDescriptions.length) {
          field.setAttribute("aria-describedby", remainingDescriptions.join(" "));
        } else {
          field.removeAttribute("aria-describedby");
        }
        delete field.dataset.validationErrorId;
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
