import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "onboarding@resend.dev";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

function validateBody(body: unknown): {
  name: string;
  email: string;
  subject?: string;
  message: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (
    typeof o.name !== "string" ||
    !o.name.trim() ||
    typeof o.email !== "string" ||
    !o.email.trim() ||
    typeof o.message !== "string" ||
    !o.message.trim()
  ) {
    return null;
  }
  return {
    name: o.name.trim(),
    email: o.email.trim(),
    subject: typeof o.subject === "string" ? o.subject.trim() : undefined,
    message: o.message.trim(),
  };
}

export async function POST(request: Request) {
  const parsed = validateBody(await request.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid request. Name, email, and message are required." },
      { status: 400 }
    );
  }

  if (!resend) {
    return NextResponse.json(
      { error: "Email is not configured. Please set RESEND_API_KEY." },
      { status: 503 }
    );
  }

  const subject = parsed.subject || `Portfolio contact from ${parsed.name}`;
  const text = [
    `From: ${parsed.name} <${parsed.email}>`,
    "",
    parsed.message,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: CONTACT_EMAIL,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
