/**
 * The global the Umami tracker installs once it has loaded. Optional on
 * purpose: the script only ships in production builds that carry the two
 * Umami build variables, so every call site has to tolerate its absence.
 */
declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        eventData?: Record<string, string | number | undefined>
      ) => void;
    };
  }
}

export {};
