import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/client-ip";
import { MAX_BODY_BYTES, validateBody } from "@/lib/contact-validation";
import { contactEmail, fromEmail, trustsCloudflareHeaders } from "@/lib/env";
import { contactRateLimiter } from "@/lib/rate-limit";
import { resend } from "@/lib/resend";

// Client facing copy stays generic on purpose. Provider details, env problems
// and honeypot hits are written to the server log only.
const INVALID_MESSAGE =
  "Invalid request. A name, a valid email address and a message are required.";
const TOO_LARGE_MESSAGE = "Request body is too large.";
const TOO_MANY_MESSAGE = "Too many requests. Please try again later.";
const GENERIC_MESSAGE = "Message could not be sent. Please try again later.";

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const ip = getClientIp(request.headers, {
    trustCloudflare: trustsCloudflareHeaders(),
  });
  const limit = contactRateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: TOO_MANY_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const parsed = validateBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    if (parsed.reason === "honeypot") {
      console.warn("[contact] honeypot triggered");
    }
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  if (!resend) {
    console.error("[contact] RESEND_API_KEY is not configured");
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 503 });
  }

  let to: string;
  let from: string;
  try {
    to = contactEmail();
    from = fromEmail();
  } catch (configError) {
    console.error("[contact] email configuration error", configError);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 503 });
  }

  const subject =
    parsed.data.subject || `Portfolio contact from ${parsed.data.name}`;
  const text = [
    `From: ${parsed.data.name} <${parsed.data.email}>`,
    "",
    parsed.data.message,
  ].join("\n");

  const { error } = await resend.emails.send({ from, to, subject, text });

  if (error) {
    console.error("[contact] resend rejected the message", error);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
