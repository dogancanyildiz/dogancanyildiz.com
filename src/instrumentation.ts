/**
 * Runs once per server instance, before the first request is served.
 *
 * The site ships without a third party error tracker on purpose (decision
 * E-03): observability is the JSON log lines this process writes to stdout,
 * collected by Coolify, plus the external Uptime Kuma probe. What this hook
 * adds is a loud startup check. The SMTP transporter (Mailcow) is built at
 * module scope from the SMTP_* variables, so a production container missing
 * any of the mail variables
 * can never send a message for its whole life. Saying that in the first log
 * lines beats discovering it from a visitor's 503.
 *
 * It logs and returns: a portfolio that cannot send mail should still serve
 * its pages, so a missing variable must never crash the server.
 */

import { log } from "@/lib/log";
import { missingMailEnv } from "@/lib/mailer";

export function register(): void {
  // register is called for every runtime; the env check only describes the
  // Node.js server that actually holds the SMTP transporter.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const missing = missingMailEnv();

  if (process.env.NODE_ENV !== "production") {
    if (missing.length > 0) {
      log(
        "info",
        "mail environment is incomplete, development fallback in use",
        {
          missing: missing.join(","),
          route: "startup",
        }
      );
    }
    return;
  }

  if (missing.length > 0) {
    log(
      "error",
      "mail environment is incomplete, the contact form will answer 503",
      { missing: missing.join(","), route: "startup" }
    );
    return;
  }

  log("info", "mail environment is complete", { route: "startup" });
}
