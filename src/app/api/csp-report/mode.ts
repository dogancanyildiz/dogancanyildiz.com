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

/**
 * Reports written to the log from a single request, per mode.
 *
 * It has to move with the per client budget above, not stay fixed: the strict
 * report-only policy makes one page view emit roughly twenty violations, and a
 * browser is free to deliver them as one reports+json batch. A cap of twenty
 * would then throw away most of a page view exactly during the window the
 * measurement is running, while the raised request budget promised the reports
 * would get through. The measuring value keeps a single batch intact with room
 * to spare; the idle value stays small because with the report-only header off
 * a large batch is noise or an attack, never a real browser.
 */
export const CSP_REPORTS_PER_REQUEST = {
  idle: 20,
  measuring: 200,
} as const;
