export const CONSENT_STORAGE_KEY = "dcy-consent";
export const CONSENT_VERSION = 1;

export type ConsentState = {
  version: number;
  analytics: boolean;
  updatedAt: string;
};

/**
 * Reads the stored measurement choice. A missing, unreadable or version-
 * mismatched value is treated as "no choice yet", so the banner can ask
 * again instead of guessing.
 */
export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("analytics" in parsed)
    ) {
      return null;
    }
    const record = parsed as {
      version: unknown;
      analytics: unknown;
      updatedAt?: unknown;
    };
    if (record.version !== CONSENT_VERSION) return null;
    if (typeof record.analytics !== "boolean") return null;
    return {
      version: CONSENT_VERSION,
      analytics: record.analytics,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function serializeConsent(
  analytics: boolean,
  updatedAt = new Date().toISOString()
): string {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics,
    updatedAt,
  };
  return JSON.stringify(state);
}

export function isAnalyticsAllowed(state: ConsentState | null): boolean {
  return state?.analytics === true;
}
