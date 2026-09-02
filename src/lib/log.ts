/**
 * Structured server logging.
 *
 * The site runs as a single Node process in a Coolify container, so stdout and
 * stderr are the log pipeline and Uptime Kuma is the external probe. A third party
 * error tracker is deliberately not part of the stack (decision E-03), which
 * makes the shape of these lines the whole observability contract: one JSON
 * object per line, greppable in the Coolify log view and parseable later
 * without changing the emitters.
 *
 * Privacy rule for every caller: the visitor's message body and email address
 * never enter a log line. Only structural fields belong here, for example the
 * request id, the coarse client ip, the route and a provider error code.
 */

export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

const RESERVED_KEYS = new Set(["time", "level", "msg"]);

/** Pure formatter, so the line shape can be asserted without capturing stdout. */
export function formatLogLine(
  level: LogLevel,
  msg: string,
  fields: LogFields = {},
  time: string = new Date().toISOString()
): string {
  const payload: Record<string, unknown> = { time, level, msg };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || RESERVED_KEYS.has(key)) {
      continue;
    }
    payload[key] = value;
  }
  return JSON.stringify(payload);
}

export function log(
  level: LogLevel,
  msg: string,
  fields: LogFields = {}
): void {
  const line = formatLogLine(level, msg, fields);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

/**
 * A provider error code, e.g. EAUTH or ECONNECTION. Anything longer or with a
 * space in it is not a code, it is prose, and prose is where the payload that
 * caused the error ends up.
 */
const ERROR_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,31}$/;

/**
 * Turns an unknown thrown value into a short, safe label.
 *
 * The message never appears: it can quote the payload that caused it, and the
 * payload is exactly what must not reach the log. The name alone is often not
 * enough to act on, though, because nodemailer throws a plain "Error" and puts
 * the actionable part in `code`, so a code shaped `code` is kept next to it.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && ERROR_CODE_PATTERN.test(code)
      ? `${error.name}/${code}`
      : error.name;
  }
  return typeof error === "string" ? error : "UnknownError";
}
