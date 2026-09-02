import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { getClientIp } from "@/lib/client-ip";
import {
  CONTACT_TOPIC_LABELS,
  MAX_BODY_BYTES,
  validateBody,
} from "@/lib/contact-validation";
import {
  contactEmail,
  fromEmail,
  siteUrl,
  trustsCloudflareHeaders,
} from "@/lib/env";
import { describeError, log } from "@/lib/log";
import {
  contactRateLimiter,
  type ContactRateLimitResult,
} from "@/lib/rate-limit";
import {
  BodyTooLargeError,
  parseJsonBody,
  readBodyWithLimit,
} from "@/lib/request-body";
import { mailer } from "@/lib/mailer";
import { routing, type AppLocale } from "@/i18n/routing";
import { localeFromPathname } from "@/lib/locale-from-pathname";
import { methodNotAllowed } from "@/lib/api-methods";

const ROUTE = "/api/contact";

/**
 * Upper bound on the SMTP send. nodemailer keeps its own socket timeouts
 * (src/lib/mailer.ts) under this race, so the timeout is a ceiling on top of
 * them: the visitor gets an answer, while the upstream request is left to
 * finish or fail on its own instead of holding the handler open for minutes.
 *
 * A send that lands after the race is lost is still delivered, so a visitor
 * who was told to try again can produce a second copy of the same mail; what
 * that duplicate risk means and why it is accepted is documented at the
 * sendMail call below.
 */
const SEND_TIMEOUT_MS = 10_000;

class SendTimeoutError extends Error {
  constructor() {
    super(`The SMTP server did not answer within ${SEND_TIMEOUT_MS}ms`);
    this.name = "SendTimeoutError";
  }
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new SendTimeoutError()), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

function localeFromHeader(value: string | null): AppLocale | null {
  const candidate = value?.trim().toLowerCase() ?? "";
  return candidate && isAppLocale(candidate) ? candidate : null;
}

/**
 * A browser always attaches Origin to a cross origin or same origin POST, so a
 * missing header means the caller is not a browser form and is refused too.
 * Outside production any localhost origin is accepted, otherwise next dev on a
 * spare port could never submit the form.
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  try {
    if (parsed.origin === siteUrl()) {
      return true;
    }
  } catch {
    // NEXT_PUBLIC_SITE_URL missing is a deployment fault, not a reason to
    // accept an unverifiable origin.
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
}

/**
 * The page the form was submitted from, e.g. https://host/en/contact.
 *
 * Only a Referer from an origin this site actually serves is read. Any other
 * page can send one, and a foreign "/en/..." path would otherwise pick the
 * language of the answer and leave the Accept-Language branch below
 * unreachable for every visitor who arrived through an external link.
 */
function localeFromReferer(value: string | null): AppLocale | null {
  if (!value) {
    return null;
  }
  let referer: URL;
  try {
    referer = new URL(value);
  } catch {
    return null;
  }
  if (!isAllowedOrigin(referer.origin)) {
    return null;
  }
  return localeFromPathname(referer.pathname);
}

/**
 * Accept-Language, read the way the header is defined: every tag carries an
 * optional quality value, and the list is ordered by that value, not by
 * position. A visitor sending "en-US,en;q=0.9,tr;q=0.1" is asking for English
 * even though the string contains "tr".
 */
function localeFromAcceptLanguage(value: string | null): AppLocale | null {
  if (!value) {
    return null;
  }

  const entries = value
    .split(",")
    .map((part, index) => {
      const [tag = "", ...parameters] = part.trim().split(";");

      const quality = parameters
        .map((parameter) => parameter.trim().toLowerCase())
        .find((parameter) => parameter.startsWith("q="));
      const parsed = quality ? Number.parseFloat(quality.slice(2)) : 1;
      return {
        base: tag.trim().toLowerCase().split("-")[0] ?? "",

        quality: Number.isFinite(parsed) ? parsed : 0,
        index,
      };
    })
    .filter((entry) => entry.base.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const entry of entries) {
    if (isAppLocale(entry.base)) {
      return entry.base;
    }
  }
  return null;
}

/**
 * Route Handlers never receive the [lang] root param, so the locale has to
 * come from the request itself. It is resolved once, before any other check,
 * so a 415, a 403, a 413 and a 429 all answer in the same language as a 400.
 */
function resolveLocale(request: Request): AppLocale {
  const { headers } = request;
  return (
    localeFromHeader(headers.get("x-locale")) ??
    localeFromReferer(headers.get("referer")) ??
    localeFromAcceptLanguage(headers.get("accept-language")) ??
    routing.defaultLocale
  );
}

function isJsonRequest(contentType: string | null): boolean {
  const mediaType = (contentType ?? "").split(";")[0]?.trim().toLowerCase();

  return mediaType === "application/json";
}

type ResponseOptions = {
  status: number;
  requestId: string;
  budget?: ContactRateLimitResult;
  retryAfterSeconds?: number;
};

function jsonResponse(
  body: Record<string, unknown>,
  options: ResponseOptions
): NextResponse {
  const headers: Record<string, string> = { "X-Request-Id": options.requestId };
  if (options.budget) {
    headers["X-RateLimit-Limit"] = String(options.budget.limit);
    headers["X-RateLimit-Remaining"] = String(options.budget.remaining);
  }
  if (options.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(options.retryAfterSeconds);
  }
  return NextResponse.json(body, { status: options.status, headers });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const locale = resolveLocale(request);
  const t = await getTranslations({ locale, namespace: "api" });

  const ip = getClientIp(request.headers, {
    trustCloudflare: trustsCloudflareHeaders(),
  });

  // The rate limit is the first decision, so no cheaper rejection can be used
  // to walk past it. The slot itself is spent further down, once the request
  // has proved to be a real submission attempt: a 415, a 403 or a 413 refused
  // on its declared length should not eat the budget of the visitor behind
  // that ip.
  const budget = contactRateLimiter.peek(ip);
  if (!budget.allowed) {
    log("warn", "contact request rate limited", {
      requestId,
      ip,
      route: ROUTE,
    });
    return jsonResponse(
      { error: t("tooManyRequests") },
      {
        status: 429,
        requestId,
        budget,
        retryAfterSeconds: budget.retryAfterSeconds,
      }
    );
  }

  if (!isJsonRequest(request.headers.get("content-type"))) {
    return jsonResponse(
      { error: t("unsupportedMediaType") },
      { status: 415, requestId }
    );
  }

  if (!isAllowedOrigin(request.headers.get("origin"))) {
    log("warn", "contact request origin refused", {
      requestId,
      ip,
      route: ROUTE,
    });
    return jsonResponse(
      { error: t("forbiddenOrigin") },
      { status: 403, requestId }
    );
  }

  // Content-Length is advisory (a chunked request carries none), so this is
  // only a cheap early exit. The real cap is enforced while the body is read.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { error: t("bodyTooLarge") },
      { status: 413, requestId }
    );
  }

  // From here the caller looks like a submission from the form itself, so it
  // spends a slot even if the payload turns out to be junk. That is what stops
  // a scripted probe from hammering the endpoint for free. The slot is spent
  // before the body is read rather than after: a caller that opens the POST
  // and never finishes its body holds a handler open, and it has to pay for
  // that out of the same budget as a completed request.
  const spent = contactRateLimiter.check(ip);
  if (!spent.allowed) {
    log("warn", "contact request rate limited", {
      requestId,
      ip,
      route: ROUTE,
    });
    return jsonResponse(
      { error: t("tooManyRequests") },
      {
        status: 429,
        requestId,
        budget: spent,
        retryAfterSeconds: spent.retryAfterSeconds,
      }
    );
  }

  let rawBody: string;
  try {
    rawBody = await readBodyWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return jsonResponse(
        { error: t("bodyTooLarge") },
        { status: 413, requestId, budget: spent }
      );
    }
    return jsonResponse(
      { error: t("invalidRequest") },
      { status: 400, requestId, budget: spent }
    );
  }

  const parsed = validateBody(parseJsonBody(rawBody));
  if (!parsed.ok) {
    if (parsed.reason === "honeypot") {
      log("warn", "contact honeypot triggered", {
        requestId,
        ip,
        route: ROUTE,
      });
      // Answered like a success on purpose: a bot that can tell the honeypot
      // apart from a delivery is a bot that can tune around it.
      return jsonResponse(
        { ok: true },
        { status: 200, requestId, budget: spent }
      );
    }
    return jsonResponse(
      { error: t("invalidRequest"), field: parsed.field },
      { status: 400, requestId, budget: spent }
    );
  }

  if (!mailer) {
    log("error", "contact mail transport is not configured", {
      requestId,
      route: ROUTE,
    });
    return jsonResponse(
      { error: t("emailNotConfigured") },
      { status: 503, requestId, budget: spent }
    );
  }

  let to: string;
  let from: string;
  try {
    to = contactEmail();
    from = fromEmail();
  } catch (configError) {
    log("error", "contact mail configuration is incomplete", {
      requestId,
      route: ROUTE,
      detail: describeError(configError),
    });
    return jsonResponse(
      { error: t("emailNotConfigured") },
      { status: 503, requestId, budget: spent }
    );
  }

  // Plain labelled lines rather than a leading "From:", which reads like a
  // mail header in a client that renders the body as source. The values are
  // already free of CR and LF, so neither line can be split.
  const topicLabel = CONTACT_TOPIC_LABELS[parsed.data.topic];
  const text = [
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Topic: ${topicLabel}`,
    "",
    parsed.data.message,
  ].join("\n");

  try {
    // nodemailer rejects on failure, there is no error tuple to unwrap. No
    // idempotency key either: SMTP has no provider side dedupe window, so a
    // retry after a lost 10s race can deliver a second copy. Accepted, the
    // recipient is the owner's own inbox (decision 2026-08-31).
    await withTimeout(
      mailer.sendMail({
        from,
        to,
        subject: `Portfolio contact from ${parsed.data.name} (${topicLabel})`,
        text,
        // Answering the visitor is a reply in the mail client, not a copy
        // and paste out of the body.
        replyTo: parsed.data.email,
      }),
      SEND_TIMEOUT_MS
    );
  } catch (sendError) {
    const timedOut = sendError instanceof SendTimeoutError;
    log("error", timedOut ? "contact send timed out" : "contact send failed", {
      requestId,
      route: ROUTE,
      // describeError keeps the code/name, never the message: an SMTP error
      // string can quote the envelope, so it stays out of the logs.
      detail: describeError(sendError),
    });
    return jsonResponse(
      { error: timedOut ? t("sendTimeout") : t("sendFailed") },
      { status: timedOut ? 504 : 500, requestId, budget: spent }
    );
  }

  log("info", "contact message accepted", {
    requestId,
    ip,
    route: ROUTE,
    remaining: spent.remaining,
  });
  return jsonResponse({ ok: true }, { status: 200, requestId, budget: spent });
}

// Every other verb answers 405 with an Allow header (see @/lib/api-methods).
const rejectMethod = methodNotAllowed("POST, OPTIONS");
export {
  rejectMethod as GET,
  rejectMethod as PUT,
  rejectMethod as PATCH,
  rejectMethod as DELETE,
};
