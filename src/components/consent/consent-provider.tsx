"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { UmamiTag } from "@/lib/analytics";
import {
  CONSENT_STORAGE_KEY,
  isAnalyticsAllowed,
  parseConsent,
  serializeConsent,
  type ConsentState,
} from "@/lib/consent";

type ConsentSnapshot =
  { known: false } | { known: true; value: ConsentState | null };

type ConsentContextValue = {
  ready: boolean;
  choice: ConsentState | null;
  tag: UmamiTag | null;
  setAnalytics: (analytics: boolean) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: ConsentSnapshot = { known: false };
let memoryOverride: ConsentState | undefined;
let cachedRaw: string | undefined;
let cachedSnapshot: ConsentSnapshot = SERVER_SNAPSHOT;

function emitConsentChange() {
  cachedRaw = undefined;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function storedRaw(): string {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getSnapshot(): ConsentSnapshot {
  const raw =
    memoryOverride !== undefined
      ? serializeConsent(memoryOverride.analytics, memoryOverride.updatedAt)
      : storedRaw();
  if (cachedRaw === raw && cachedSnapshot.known) {
    return cachedSnapshot;
  }
  cachedRaw = raw;
  cachedSnapshot = {
    known: true,
    value:
      memoryOverride !== undefined ? memoryOverride : parseConsent(raw || null),
  };
  return cachedSnapshot;
}

function getServerSnapshot(): ConsentSnapshot {
  return SERVER_SNAPSHOT;
}

export function resetConsentMemory() {
  memoryOverride = undefined;
  cachedRaw = undefined;
  cachedSnapshot = SERVER_SNAPSHOT;
}

/**
 * Every script element this provider injected for `tag`. Matched on the
 * resolved `src` property rather than an attribute selector, because the tag
 * url is arbitrary text and would have to be escaped to sit inside one.
 */
function trackerScripts(tag: UmamiTag): HTMLScriptElement[] {
  return [...document.querySelectorAll("script")].filter(
    (script) => script.src === tag.src
  );
}

function injectTracker(tag: UmamiTag) {
  if (trackerScripts(tag).length > 0) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = tag.src;
  script.dataset.websiteId = tag.websiteId;
  if (tag.domains) {
    script.dataset.domains = tag.domains;
  }
  document.body.appendChild(script);
}

/**
 * Undoes injectTracker when a visitor withdraws consent. Removing the element
 * stops nothing that is already running, so the global the script installs
 * goes with it: window.umami is how every later call reaches the collector,
 * and without this a withdrawal would only take effect on the next reload.
 */
function removeTracker(tag: UmamiTag) {
  for (const script of trackerScripts(tag)) {
    script.remove();
  }
  delete (window as { umami?: unknown }).umami;
}

export function ConsentProvider({
  tag,
  children,
}: {
  tag: UmamiTag | null;
  children: React.ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const ready = snapshot.known;
  const choice = snapshot.known ? snapshot.value : null;

  useEffect(() => {
    if (!ready || !tag) {
      return;
    }
    if (isAnalyticsAllowed(choice)) {
      injectTracker(tag);
      return;
    }
    // Reached on a withdrawal from /privacy and on a storage event from
    // another tab, as well as on the plain "no choice yet" first render.
    removeTracker(tag);
  }, [ready, tag, choice]);

  const setAnalytics = useCallback((analytics: boolean) => {
    const serialized = serializeConsent(analytics);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
      // The write landed, so storage is the record again. Holding on to the
      // in-memory copy would pin this tab to its own value and make it ignore
      // a later change made in another tab.
      memoryOverride = undefined;
    } catch {
      // Private mode can refuse localStorage; the in-memory copy still closes
      // the banner and honours the choice for this visit.
      memoryOverride = parseConsent(serialized) ?? undefined;
    }
    emitConsentChange();
  }, []);

  const value = useMemo(
    () => ({ ready, choice, tag, setAnalytics }),
    [ready, choice, tag, setAnalytics]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error("useConsent must be used inside ConsentProvider");
  }
  return value;
}
