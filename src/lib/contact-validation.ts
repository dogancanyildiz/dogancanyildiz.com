/**
 * Server side validation for the contact endpoint.
 *
 * The honeypot field lives in the form as a visually hidden input. The client
 * short circuits when it is filled, but a bot posting straight to the route
 * skips that path, so the field is checked here as well.
 */

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 200;
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 5000;

/** Upper bound for the raw request body, checked through Content-Length. */
export const MAX_BODY_BYTES = 16384;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; data: ContactPayload }
  | { ok: false; reason: "invalid" | "honeypot" };

const invalid: ValidationResult = { ok: false, reason: "invalid" };
const honeypot: ValidationResult = { ok: false, reason: "honeypot" };

export function validateBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return invalid;
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.website === "string" && raw.website.trim().length > 0) {
    return honeypot;
  }

  if (
    typeof raw.name !== "string" ||
    typeof raw.email !== "string" ||
    typeof raw.message !== "string"
  ) {
    return invalid;
  }

  const name = raw.name.trim();
  const email = raw.email.trim();
  const message = raw.message.trim();
  const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) {
    return invalid;
  }
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return invalid;
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return invalid;
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return invalid;
  }

  const data: ContactPayload = { name, email, message };
  if (subject) {
    data.subject = subject;
  }

  return { ok: true, data };
}
