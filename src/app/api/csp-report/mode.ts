/**
 * Opt-in switch for the strict Content-Security-Policy-Report-Only measurement.
 *
 * The report-only policy drops both 'unsafe-inline' values, so a prerendered
 * page reports roughly one violation per inline script tag and per inline style
 * attribute: about twenty POSTs to /api/csp-report per page view, each of them
 * a log line. That is the price of a measurement, not something to pay on every
 * visit forever, and the collector's per client budget is exhausted after a
 * couple of views anyway, which makes the permanent version both expensive and
 * incomplete.
 *
 * So the header only ships while CSP_REPORT_ONLY=1 is set on the build, for a
 * bounded window, and the collector raises its budget for the same window.
 *
 * Kept in a module with no imports because next.config.ts reads it at config
 * evaluation time and the route handler reads it at runtime; both have to see
 * one definition.
 */

/** Build time variable that turns the measurement on. Any other value is off. */
export const CSP_REPORT_ONLY_ENV = "CSP_REPORT_ONLY";

export function isCspMeasurementEnabled(
  value: string | undefined = process.env[CSP_REPORT_ONLY_ENV]
): boolean {
  return value?.trim() === "1";
}

/**
 * Per client budget for the collector, per minute. The idle value only has to
 * absorb the occasional violation from an enforced policy break; the measuring
 * value has to survive a real browsing session against the strict policy.
 */
export const CSP_REPORT_LIMITS = {
  idle: 30,
  measuring: 600,
} as const;
