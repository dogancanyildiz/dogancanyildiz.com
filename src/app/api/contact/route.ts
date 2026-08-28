import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { getClientIp } from "@/lib/client-ip";
import { MAX_BODY_BYTES, validateBody } from "@/lib/contact-validation";
import { contactEmail, fromEmail, trustsCloudflareHeaders } from "@/lib/env";
import { contactRateLimiter } from "@/lib/rate-limit";
import {
  BodyTooLargeError,
  parseJsonBody,
  readBodyWithLimit,
} from "@/lib/request-body";
import { resend } from "@/lib/resend";
import { routing, type AppLocale } from "@/i18n/routing";

function localeFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return routing.defaultLocale;
  const lower = header.toLowerCase();
  if (lower.includes("tr")) return "tr";
  return routing.defaultLocale;
}

async function apiMessage(
  request: Request,
  key: "bodyTooLarge" | "tooManyRequests" | "invalidRequest" | "emailNotConfigured" | "sendFailed",
  locale?: AppLocale
): Promise<string> {
  const resolved =
    locale ??
    localeFromAcceptLanguage(request.headers.get("accept-language"));
  const t = await getTranslations({ locale: resolved, namespace: "api" });
  return t(key);
}

/**
 * Route Handlers do not receive the [lang] root param, so the client sends the
 * locale in the request body. Anything unexpected falls back to the default.
 */
function resolveLocale(value: unknown): AppLocale {
  return routing.locales.includes(value as AppLocale)
    ? (value as AppLocale)
    : routing.defaultLocale;
}

export async function POST(request: Request) {
  // Content-Length is advisory (a chunked request carries none), so this is
  // only a cheap early exit. The real cap is enforced while the body is read.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: await apiMessage(request, "bodyTooLarge") },
      { status: 413 }
    );
  }

  const ip = getClientIp(request.headers, {
    trustCloudflare: trustsCloudflareHeaders(),
  });
  const limit = contactRateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: await apiMessage(request, "tooManyRequests") },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let rawBody: string;
  try {
    rawBody = await readBodyWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return NextResponse.json(
        { error: await apiMessage(request, "bodyTooLarge") },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { error: await apiMessage(request, "invalidRequest") },
      { status: 400 }
    );
  }

  const body = parseJsonBody(rawBody);
  const locale = resolveLocale(
    body && typeof body === "object"
      ? (body as Record<string, unknown>).locale
      : undefined
  );
  const t = await getTranslations({ locale, namespace: "api" });

  const parsed = validateBody(body);
  if (!parsed.ok) {
    if (parsed.reason === "honeypot") {
      console.warn("[contact] honeypot triggered");
    }
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }

  if (!resend) {
    console.error("[contact] RESEND_API_KEY is not configured");
    return NextResponse.json(
      { error: t("emailNotConfigured") },
      { status: 503 }
    );
  }

  let to: string;
  let from: string;
  try {
    to = contactEmail();
    from = fromEmail();
  } catch (configError) {
    console.error("[contact] email configuration error", configError);
    return NextResponse.json(
      { error: t("emailNotConfigured") },
      { status: 503 }
    );
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
    return NextResponse.json({ error: t("sendFailed") }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
