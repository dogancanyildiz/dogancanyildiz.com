import { describe, expect, it } from "vitest";

import {
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SUBJECT_LENGTH,
  validateBody,
} from "./contact-validation";

const validBody = {
  name: "Doğan Can",
  email: "visitor@mail.invalid",
  subject: "Hello",
  message: "I would like to talk about a project.",
};

describe("validateBody", () => {
  it("accepts a well formed body and trims every field", () => {
    const result = validateBody({
      name: "  Doğan Can  ",
      email: "  visitor@mail.invalid ",
      subject: "  Hello  ",
      message: "  I would like to talk about a project.  ",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Doğan Can",
        email: "visitor@mail.invalid",
        subject: "Hello",
        message: "I would like to talk about a project.",
      },
    });
  });

  it("treats a missing subject as absent instead of empty", () => {
    const result = validateBody({
      name: validBody.name,
      email: validBody.email,
      message: validBody.message,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: validBody.name,
        email: validBody.email,
        message: validBody.message,
      },
    });
  });

  it("rejects a filled honeypot field with its own reason", () => {
    const result = validateBody({
      ...validBody,
      website: "http://spam.invalid",
    });
    expect(result).toEqual({ ok: false, reason: "honeypot" });
  });

  it("ignores an empty honeypot field", () => {
    const result = validateBody({ ...validBody, website: "   " });
    expect(result.ok).toBe(true);
  });

  it("rejects a non object body", () => {
    expect(validateBody(null)).toEqual({ ok: false, reason: "invalid" });
    expect(validateBody("hello")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects missing required fields", () => {
    expect(validateBody({ name: "a", email: "a@b.co" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects whitespace only fields", () => {
    expect(validateBody({ ...validBody, message: "   " })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an address without a dotted domain", () => {
    expect(validateBody({ ...validBody, email: "visitor@localhost" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an address with a space in it", () => {
    expect(
      validateBody({ ...validBody, email: "vis itor@mail.invalid" })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long name", () => {
    expect(
      validateBody({ ...validBody, name: "n".repeat(MAX_NAME_LENGTH + 1) })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long email", () => {
    const longLocal = "e".repeat(MAX_EMAIL_LENGTH);
    expect(
      validateBody({ ...validBody, email: `${longLocal}@mail.invalid` })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long subject", () => {
    expect(
      validateBody({
        ...validBody,
        subject: "s".repeat(MAX_SUBJECT_LENGTH + 1),
      })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long message", () => {
    expect(
      validateBody({
        ...validBody,
        message: "m".repeat(MAX_MESSAGE_LENGTH + 1),
      })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("accepts a message that sits exactly on the limit", () => {
    const result = validateBody({
      ...validBody,
      message: "m".repeat(MAX_MESSAGE_LENGTH),
    });
    expect(result.ok).toBe(true);
  });
});
