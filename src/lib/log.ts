/**
 * Structured server logging.
 *
 * The site runs as a single Node process in a Coolify container, so stdout and
 * stderr are the log pipeline and Gatus is the external probe. A third party
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
 * Turns an unknown thrown value into a short, safe label. Only the error name
 * is used: a message can quote the payload that caused it, and the payload is
 * exactly what must not reach the log.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }
  return typeof error === "string" ? error : "UnknownError";
}
