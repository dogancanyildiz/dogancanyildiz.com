/**
 * Custom Umami events, in one place so a name is written once and spelled the
 * same way everywhere.
 *
 * Almost every event is declarative: Umami's own tracker listens for clicks on
 * elements carrying `data-umami-event` and reads the extra fields off
 * `data-umami-event-<field>`, so a marked link costs no JavaScript of ours and
 * does nothing at all when the tracker is not loaded (development, or a
 * deployment without the two Umami build variables). The one imperative case
 * is the contact form, where the event belongs to the response rather than to
 * the click.
 */
export const UMAMI_EVENT = {
  cvDownload: "cv-download",
  contactSubmit: "contact-submit",
  whatsappClick: "whatsapp-click",
  outboundClick: "outbound-click",
  themeToggle: "theme-toggle",
  localeSwitch: "locale-switch",
} as const;

export type UmamiEventName = (typeof UMAMI_EVENT)[keyof typeof UMAMI_EVENT];

export type UmamiEventData = Record<string, string | number | undefined>;

/**
 * The data attributes that mark an element as an event. Spread onto the
 * element: `<a {...umamiEvent(UMAMI_EVENT.cvDownload, { locale })} />`.
 *
 * Empty and undefined fields are dropped rather than sent as "": an absent
 * property reads as "not known" in the dashboard, an empty string reads as a
 * value someone recorded on purpose.
 */
export function umamiEvent(
  name: UmamiEventName,
  data?: UmamiEventData
): Record<string, string> {
  const attributes: Record<string, string> = { "data-umami-event": name };
  for (const [field, value] of Object.entries(data ?? {})) {
    if (value === undefined || value === "") continue;
    attributes[`data-umami-event-${field}`] = String(value);
  }
  return attributes;
}

/**
 * Hostname of an outbound target, which is the only thing recorded about it:
 * "github.com" rather than the full profile url, so the event says which
 * network a visitor left for and nothing more. mailto has no host, so it
 * reports the scheme instead of an empty string.
 */
export function linkHost(href: string): string {
  try {
    const url = new URL(href);
    return url.protocol === "mailto:" ? "mailto" : url.hostname;
  } catch {
    return "";
  }
}

/** umamiEvent for a link that leaves the site, keyed on its host. */
export function outboundEvent(href: string): Record<string, string> {
  return umamiEvent(UMAMI_EVENT.outboundClick, { host: linkHost(href) });
}

/**
 * The imperative form, for an event that is not a click. Silent when the
 * tracker never loaded, and never allowed to break the caller: a failure to
 * count a submission must not turn a delivered message into an error state.
 */
export function trackUmamiEvent(
  name: UmamiEventName,
  data?: UmamiEventData
): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(name, data);
  } catch {
    // Measurement is never worth a broken interaction.
  }
}
