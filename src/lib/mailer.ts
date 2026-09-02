import { createTransport, type Transporter } from "nodemailer";

/**
 * Contact mail goes out through the owner's own Mailcow server over SMTP
 * (decision 2026-08-31, docs/05-backend-icerik-ve-servisler.md): the form only
 * ever delivers to the owner's own inbox, so a transactional provider's
 * deliverability reputation buys nothing here, and dropping Resend removes the
 * last third party service from the runtime path. DKIM signing and SPF for the
 * sender domain live on the Mailcow side, not in this repo.
 *
 * The runtime variables the contact form needs before it can send anything.
 * They are read at module scope for the transporter below, so a container
 * started without them stays unable to send for its whole life. That is why
 * instrumentation.ts checks the same list at startup and the health endpoint
 * reports it, instead of the gap only surfacing as a 503 for a visitor.
 * SMTP_PORT is deliberately not in the list: it defaults to 587.
 */
export const MAIL_ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "CONTACT_EMAIL",
  "FROM_EMAIL",
] as const;

export function missingMailEnv(
  env: Record<string, string | undefined> = process.env
): string[] {
  return MAIL_ENV_KEYS.filter((name) => !env[name]?.trim());
}

function resolvePort(raw: string | undefined): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535
    ? parsed
    : 587;
}

const host = process.env.SMTP_HOST?.trim();
const user = process.env.SMTP_USER?.trim();
const password = process.env.SMTP_PASSWORD?.trim();
const port = resolvePort(process.env.SMTP_PORT);

/**
 * Null when the SMTP variables are absent, mirroring the old Resend client:
 * the route answers 503 and never builds a transporter it cannot use.
 *
 * 465 is implicit TLS; anything else (587 submission on Mailcow) starts plain
 * and upgrades, with requireTLS so a downgraded connection fails instead of
 * sending the message and the credentials in the clear. The socket timeouts
 * sit under the route's own 10s send race, so a stuck connection surfaces as
 * the same 504 either way.
 */
export const mailer: Transporter | null =
  host && user && password
    ? createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        auth: { user, pass: password },
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 10_000,
      })
    : null;
