import { Resend } from "resend";

/**
 * The three runtime variables the contact form needs before it can send
 * anything. They are read at module scope for the client below, so a container
 * started without them stays unable to send for its whole life. That is why
 * instrumentation.ts checks the same list at startup and the health endpoint
 * reports it, instead of the gap only surfacing as a 503 for a visitor.
 */
export const MAIL_ENV_KEYS = [
  "RESEND_API_KEY",
  "CONTACT_EMAIL",
  "FROM_EMAIL",
] as const;

export function missingMailEnv(
  env: Record<string, string | undefined> = process.env
): string[] {
  return MAIL_ENV_KEYS.filter((name) => !env[name]?.trim());
}

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
