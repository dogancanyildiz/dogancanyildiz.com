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
 * Source level assertions on the contact form, for the handful of properties
 * a render test genuinely does not observe any better than a grep: autofill
 * attributes, the honeypot name and the maxLength constants are all static
 * markup, not behaviour.
 *
 * Everything else that used to live here as a source-text stand-in (focus
 * landing on the first invalid field, the live regions staying mounted
 * through every status, the readOnly/aria-disabled lock, the Retry-After
 * countdown, the X-Locale header, the per field server error) is now a real
 * jsdom render test in src/components/sections/contact-form.test.tsx, which
 * exercises the actual behaviour instead of matching the string that used to
 * produce it.
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

describe("contact form request", () => {
  it("gives the request a timeout with its own message", () => {
    // The timeout duration and its wiring into the fetch signal are not
    // observable from outside a jsdom render (asserting it would mean
    // advancing a fake clock to exactly REQUEST_TIMEOUT_MS while the fetch
    // mock watches for an abort), so this stays a source assertion; the
    // message it produces once the request does time out is covered by
    // contact-form.test.tsx's "shows the timeout message" case.
    expect(form).toContain("AbortSignal.timeout(REQUEST_TIMEOUT_MS)");
    expect(form).toContain('t("errorTimeout")');
  });
});
