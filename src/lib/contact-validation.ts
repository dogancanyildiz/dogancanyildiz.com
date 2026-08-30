/**
 * Shared validation contract for the contact endpoint.
 *
 * This module is imported by both the route handler and the client form, so it
 * must stay free of server only imports: the limits the form enforces and the
 * limits the server enforces come from the same constants, and a value the
 * browser accepts can never be one the API rejects.
 *
 * The honeypot field lives in the form as a visually hidden input. The client
 * posts whatever it holds and lets the server decide, so a filled field is
 * checked here rather than short circuited in the browser.
 */

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Closed set of service headings the form offers. The posted value is one of
 * these ids, never the translated label: the inbox maps the id to a stable
 * English line, and an unknown string is refused the same way a missing field
 * is.
 */
export const CONTACT_TOPICS = ["web", "devops", "security", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  web: "Web development",
  devops: "DevOps and infrastructure",
  security: "Security",
  other: "Other",
};

const CONTACT_TOPIC_SET: ReadonlySet<string> = new Set(CONTACT_TOPICS);

/**
 * Worst case cost in body bytes of one UTF-16 code unit, which is the unit
 * maxLength and String.length count. Three bytes for a U+0800..U+FFFF
 * character, four for a surrogate pair (two units), two for the ASCII
 * characters JSON escapes, and six for a \\uXXXX escape, which is the ceiling.
 */
const MAX_BYTES_PER_CODE_UNIT = 6;

/** Key names, quotes, braces and the empty honeypot value. */
const BODY_ENVELOPE_BYTES = 1024;

/** Longest current topic id, counted in code units the same way as the rest. */
const MAX_TOPIC_LENGTH = Math.max(
  ...CONTACT_TOPICS.map((topic) => topic.length)
);

/**
 * Upper bound for the raw request body, checked through Content-Length and
 * again while the stream is read.
 *
 * It is derived from the field limits rather than picked, so a message the
 * form accepts can never be one the API refuses: the form counts characters,
 * the body cap counts bytes, and a Turkish or emoji message fills the byte
 * budget long before it fills the character budget.
 */
export const MAX_BODY_BYTES =
  (MAX_NAME_LENGTH + MAX_EMAIL_LENGTH + MAX_MESSAGE_LENGTH + MAX_TOPIC_LENGTH) *
    MAX_BYTES_PER_CODE_UNIT +
  BODY_ENVELOPE_BYTES;

/**
 * The honeypot input name. Deliberately not "website", "url" or anything else
 * a browser autofill profile recognises: an autofilled honeypot would silently
 * swallow a real visitor's message.
 */
export const HONEYPOT_FIELD = "extra_field";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

/**
 * Any CR, LF, NUL or other C0 control character in a single line field. Those
 * values end up in the subject line and in the reply-to address of the
 * outgoing mail, where a newline is what turns a value into a forged header.
 */
const CONTROL_CHARACTER_PATTERN = /[\r\n\x00-\x1f]/;

/** C0 and DEL except the whitespace a multi line message legitimately uses. */
const STRIPPED_CHARACTERS_PATTERN = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/**
 * The exact set of keys a contact submission may carry. Anything else is a
 * client that is not the site's own form, so it is refused rather than
 * silently ignored. The locale is read from the X-Locale request header, not
 * from the body.
 */
const ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  "name",
  "email",
  "topic",
  "message",
  HONEYPOT_FIELD,
]);

export type ContactField = "name" | "email" | "topic" | "message";

export type ContactPayload = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
};

export type ValidationResult =
  | { ok: true; data: ContactPayload }
  | { ok: false; reason: "invalid"; field?: ContactField }
  | { ok: false; reason: "honeypot" };

function invalid(field?: ContactField): ValidationResult {
  return field
    ? { ok: false, reason: "invalid", field }
    : { ok: false, reason: "invalid" };
}

export function stripControlCharacters(value: string): string {
  return value.replace(STRIPPED_CHARACTERS_PATTERN, "");
}

export function validateBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalid();
  }

  const raw = body as Record<string, unknown>;

  const honeypotValue = raw[HONEYPOT_FIELD];
  if (typeof honeypotValue === "string" && honeypotValue.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_FIELDS.has(key)) {
      return invalid();
    }
  }

  if (typeof raw.name !== "string") {
    return invalid("name");
  }
  if (typeof raw.email !== "string") {
    return invalid("email");
  }
  if (typeof raw.topic !== "string") {
    return invalid("topic");
  }
  if (typeof raw.message !== "string") {
    return invalid("message");
  }

  const name = raw.name.trim();
  const email = raw.email.trim();
  const topic = raw.topic.trim();
  const message = stripControlCharacters(raw.message).trim();

  if (
    !name ||
    name.length > MAX_NAME_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(name)
  ) {
    return invalid("name");
  }
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(email) ||
    !EMAIL_PATTERN.test(email)
  ) {
    return invalid("email");
  }
  if (!CONTACT_TOPIC_SET.has(topic)) {
    return invalid("topic");
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return invalid("message");
  }

  return {
    ok: true,
    data: { name, email, topic: topic as ContactTopic, message },
  };
}
