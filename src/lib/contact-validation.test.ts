import { describe, expect, it } from "vitest";

import {
  CONTACT_TOPICS,
  HONEYPOT_FIELD,
  MAX_BODY_BYTES,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  stripControlCharacters,
  validateBody,
} from "./contact-validation";

const validBody = {
  name: "Doğan Can",
  email: "visitor@mail.invalid",
  topic: "web",
  message: "I would like to talk about a project.",
};

describe("validateBody", () => {
  it("accepts a well formed body and trims every field", () => {
    const result = validateBody({
      name: "  Doğan Can  ",
      email: "  visitor@mail.invalid ",
      topic: " web ",
      message: "  I would like to talk about a project.  ",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Doğan Can",
        email: "visitor@mail.invalid",
        topic: "web",
        message: "I would like to talk about a project.",
      },
    });
  });

  it("rejects a filled honeypot field with its own reason", () => {
    const result = validateBody({
      ...validBody,
      [HONEYPOT_FIELD]: "http://spam.invalid",
    });
    expect(result).toEqual({ ok: false, reason: "honeypot" });
  });

  it("ignores an empty honeypot field", () => {
    const result = validateBody({ ...validBody, [HONEYPOT_FIELD]: "   " });
    expect(result.ok).toBe(true);
  });

  it("ignores a honeypot the form did not post at all", () => {
    expect(validateBody({ ...validBody }).ok).toBe(true);
    expect(validateBody({ ...validBody, [HONEYPOT_FIELD]: null }).ok).toBe(
      true
    );
  });

  it.each([1, true, ["spam"], { href: "spam" }])(
    "treats a non string honeypot value (%j) as filled",
    (value) => {
      // The field is a text input, so anything but a string is a client that
      // is not the form. Reading only the string case let a bot walk past the
      // honeypot by posting a number.
      expect(validateBody({ ...validBody, [HONEYPOT_FIELD]: value })).toEqual({
        ok: false,
        reason: "honeypot",
      });
    }
  );

  it("does not use a honeypot name a browser autofill would recognise", () => {
    expect(HONEYPOT_FIELD).not.toMatch(/website|url|company|organization/i);
    // A field the browser fills is a field that silently eats real messages.
    expect(validateBody({ ...validBody, website: "filled" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a non object body", () => {
    expect(validateBody(null)).toEqual({ ok: false, reason: "invalid" });
    expect(validateBody("hello")).toEqual({ ok: false, reason: "invalid" });
    expect(validateBody([validBody])).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an unknown field instead of ignoring it", () => {
    expect(validateBody({ ...validBody, subject: "Hello" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(validateBody({ ...validBody, locale: "tr" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("names the field that failed", () => {
    expect(validateBody({ ...validBody, name: "" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "name",
    });
    expect(validateBody({ ...validBody, email: "nope" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "email",
    });
    expect(validateBody({ ...validBody, message: "   " })).toEqual({
      ok: false,
      reason: "invalid",
      field: "message",
    });
    expect(validateBody({ ...validBody, topic: "" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "topic",
    });
    expect(validateBody({ ...validBody, topic: "consulting" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "topic",
    });
  });

  it("accepts every published topic id", () => {
    for (const topic of CONTACT_TOPICS) {
      expect(validateBody({ ...validBody, topic })).toEqual({
        ok: true,
        data: { ...validBody, topic },
      });
    }
  });

  it("rejects missing required fields", () => {
    expect(validateBody({ name: "a", email: "a@b.co", topic: "web" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "message",
    });
  });

  it("rejects an address without a dotted domain", () => {
    expect(validateBody({ ...validBody, email: "visitor@localhost" })).toEqual({
      ok: false,
      reason: "invalid",
      field: "email",
    });
  });

  it("rejects an address with a space in it", () => {
    expect(
      validateBody({ ...validBody, email: "vis itor@mail.invalid" })
    ).toEqual({ ok: false, reason: "invalid", field: "email" });
  });

  it("rejects an over long name", () => {
    expect(
      validateBody({ ...validBody, name: "n".repeat(MAX_NAME_LENGTH + 1) })
    ).toEqual({ ok: false, reason: "invalid", field: "name" });
  });

  it("rejects an over long email", () => {
    const longLocal = "e".repeat(MAX_EMAIL_LENGTH);
    expect(
      validateBody({ ...validBody, email: `${longLocal}@mail.invalid` })
    ).toEqual({ ok: false, reason: "invalid", field: "email" });
  });

  it("rejects an over long message", () => {
    expect(
      validateBody({
        ...validBody,
        message: "m".repeat(MAX_MESSAGE_LENGTH + 1),
      })
    ).toEqual({ ok: false, reason: "invalid", field: "message" });
  });

  it("accepts a message that sits exactly on the limit", () => {
    const result = validateBody({
      ...validBody,
      message: "m".repeat(MAX_MESSAGE_LENGTH),
    });
    expect(result.ok).toBe(true);
  });
});

describe("validateBody header injection", () => {
  const injections = [
    "Doğan\r\nBcc: victim@mail.invalid",
    "Doğan\nSubject: forged",
    "Doğan\rX-Header: forged",
    "Doğan\u0000Can",
  ];

  it.each(injections)("rejects %j in the name", (name) => {
    expect(validateBody({ ...validBody, name })).toEqual({
      ok: false,
      reason: "invalid",
      field: "name",
    });
  });

  it.each(injections)("rejects %j in the email", (value) => {
    expect(
      validateBody({ ...validBody, email: `visitor@mail.invalid${value}` })
    ).toEqual({ ok: false, reason: "invalid", field: "email" });
  });

  // The accepted address is handed to nodemailer as Reply-To. A comma or a
  // semicolon there turns one value into an address list, and the angle
  // brackets, quotes, parentheses and colon are the rest of the RFC 5322
  // address grammar, so none of them may survive validation.
  it.each([
    "visitor,attacker@mail.invalid",
    "visitor;attacker@mail.invalid",
    "<visitor@mail.invalid>",
    'visitor"name@mail.invalid',
    "visitor(comment)@mail.invalid",
    "visitor:name@mail.invalid",
    "visitor@mail,invalid.example",
    "visitor@mail.invalid>",
  ])("rejects %j, which would not stay one address in Reply-To", (email) => {
    expect(validateBody({ ...validBody, email })).toEqual({
      ok: false,
      reason: "invalid",
      field: "email",
    });
  });

  it("still accepts the addresses real visitors have", () => {
    for (const email of [
      "visitor+tag@mail.invalid",
      "first.last@sub.mail.invalid",
      "o'brien@mail.invalid",
      "çiçek@mail.invalid",
    ]) {
      expect(validateBody({ ...validBody, email }).ok).toBe(true);
    }
  });

  it("keeps the newlines a real message needs", () => {
    const message = "First line.\r\n\tIndented second line.\nThird line.";
    const result = validateBody({ ...validBody, message });
    expect(result).toEqual({
      ok: true,
      data: { ...validBody, message },
    });
  });

  it("strips the control characters a message has no use for", () => {
    const result = validateBody({
      ...validBody,
      message: "Hello\u0000\u0007 there\u007f.",
    });
    expect(result).toEqual({
      ok: true,
      data: { ...validBody, message: "Hello there." },
    });
  });
});

describe("stripControlCharacters", () => {
  it("keeps tab, carriage return and newline", () => {
    expect(stripControlCharacters("a\tb\r\nc")).toBe("a\tb\r\nc");
  });

  it("drops nul, bell and delete", () => {
    expect(stripControlCharacters("a\u0000b\u0007c\u007fd")).toBe("abcd");
  });
});

describe("MAX_BODY_BYTES", () => {
  // The form caps every field with maxLength, which counts UTF-16 code units,
  // while the API caps the request in bytes. A Turkish, CJK or emoji message
  // costs several bytes per accepted code unit, so the byte cap has to cover
  // the largest payload the form is willing to produce.
  function fill(character: string, codeUnits: number): string {
    return character.repeat(Math.floor(codeUnits / character.length));
  }

  function worstCaseBody(character: string): string {
    return JSON.stringify({
      name: fill(character, MAX_NAME_LENGTH),
      email: fill(character, MAX_EMAIL_LENGTH),
      topic: "security",
      message: fill(character, MAX_MESSAGE_LENGTH),
      [HONEYPOT_FIELD]: "",
    });
  }

  for (const [label, character] of [
    ["Turkish", "ğ"],
    ["three byte", "康"],
    ["emoji", "🙂"],
    ["escaped quote", '"'],
    // The ceiling the constant is derived from: a code unit that JSON writes
    // as a six byte \uXXXX escape.
    ["escaped control", "\u0001"],
  ] as const) {
    it(`accepts a full ${label} payload within the byte cap`, () => {
      const body = worstCaseBody(character);
      expect(body.length).toBeGreaterThan(MAX_MESSAGE_LENGTH);
      expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(
        MAX_BODY_BYTES
      );
    });
  }
});
