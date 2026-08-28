import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  HONEYPOT_FIELD,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/contact-validation";

/**
 * Source level assertions on the contact form. There is no jsdom or React
 * testing library in this project yet, so these guard the attributes a render
 * test would otherwise cover: they are cheap and they fail loudly the moment
 * an attribute is dropped in a refactor.
 */
const form = readFileSync(
  join(process.cwd(), "src/components/sections/contact-form.tsx"),
  "utf8"
);

describe("contact form autofill", () => {
  it("labels the name and email fields for autocomplete (SC 1.3.5)", () => {
    expect(form).toContain('autoComplete="name"');
    expect(form).toContain('autoComplete="email"');
  });

  it("keeps the honeypot out of every autofill profile", () => {
    expect(form).toContain(`name={HONEYPOT_FIELD}`);
    expect(HONEYPOT_FIELD).not.toMatch(/website|url|company|organization/i);
    expect(form).toContain('autoComplete="off"');
  });

  it("posts the honeypot instead of faking a success in the browser", () => {
    expect(form).toContain("[HONEYPOT_FIELD]: String(");
    expect(form).not.toMatch(/setStatus\("success"\);\s*\n\s*return;/);
  });
});

describe("contact form limits", () => {
  it("binds every maxLength to the constant the server enforces", () => {
    expect(form).toContain("maxLength={MAX_NAME_LENGTH}");
    expect(form).toContain("maxLength={MAX_EMAIL_LENGTH}");
    expect(form).toContain("maxLength={MAX_MESSAGE_LENGTH}");
    // No literal may drift away from the shared module.
    expect(form).not.toContain(`maxLength={${MAX_NAME_LENGTH}}`);
    expect(form).not.toContain(`maxLength={${MAX_EMAIL_LENGTH}}`);
    expect(form).not.toContain(`maxLength={${MAX_MESSAGE_LENGTH}}`);
  });

  it("imports the limits from the shared validation module", () => {
    expect(form).toMatch(/from "@\/lib\/contact-validation"/);
  });
});

describe("contact form validation feedback", () => {
  it("runs its own validation instead of the browser's", () => {
    expect(form).toContain("noValidate");
  });

  it("wires aria-invalid and aria-describedby to the field errors", () => {
    for (const field of ["name", "email", "message"]) {
      expect(form).toContain(
        `aria-invalid={fieldErrors.${field} ? true : undefined}`
      );
      expect(form).toContain(`aria-describedby={describedBy("${field}")}`);
    }
  });

  it("moves focus to the first field that failed", () => {
    expect(form).toContain(
      "requestFocus(FIELDS.find((field) => errors[field])"
    );
  });
});

describe("contact form live regions", () => {
  it("keeps both live regions mounted rather than rendering them with the message", () => {
    expect(form).toContain('aria-live="polite"');
    expect(form).not.toMatch(/\{status === "error" && \(/);
    expect(form).not.toMatch(/\{status === "success" && \(/);
  });

  it("announces the in flight state", () => {
    expect(form).toContain('{busy ? t("sending")');
  });

  it("locks the inputs with readOnly instead of disabled", () => {
    expect(form).toContain("readOnly: busy");
    expect(form).toContain('"aria-disabled": busy || undefined');
    expect(form).not.toMatch(/disabled=\{status === "loading"\}/);
  });

  it("moves focus to the status message after the response", () => {
    expect(form).toContain('requestFocus("status")');
    expect(form).toContain('requestFocus("alert")');
    expect(form).toContain("tabIndex={-1}");
  });
});

describe("contact form request", () => {
  it("tells the API which language to answer in", () => {
    expect(form).toContain('"X-Locale": locale');
  });

  it("gives the request a timeout with its own message", () => {
    expect(form).toContain("AbortSignal.timeout(REQUEST_TIMEOUT_MS)");
    expect(form).toContain('t("errorTimeout")');
  });

  it("honours Retry-After on a 429", () => {
    expect(form).toContain('res.headers.get("Retry-After")');
    expect(form).toContain("disabled={busy || retrySeconds > 0}");
    expect(form).toContain('t("retryAfter", { seconds: retrySeconds })');
  });
});
