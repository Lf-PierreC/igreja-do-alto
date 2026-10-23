"use client";

import { useEffect } from "react";

export function FormValidationSync() {
  useEffect(() => {
    const syncAria = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return;
      if (
        !(
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        )
      ) {
        return;
      }
      try {
        const isUserInvalid = el.matches(":user-invalid");
        el.setAttribute("aria-invalid", isUserInvalid ? "true" : "false");
      } catch {
        // Fallback if :user-invalid is unsupported
        const isValid = el.checkValidity();
        el.classList.toggle("user-invalid-fallback", !isValid);
        el.setAttribute("aria-invalid", !isValid ? "true" : "false");
      }
    };

    const handleBlur = (e: Event) => syncAria(e.target);
    const handleInput = (e: Event) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.hasAttribute("aria-invalid")
      ) {
        syncAria(e.target);
      }
    };

    document.addEventListener("blur", handleBlur, true);
    document.addEventListener("input", handleInput);

    return () => {
      document.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("input", handleInput);
    };
  }, []);

  return null;
}
