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

function injectTracker(tag: UmamiTag) {
  if (document.querySelector(`script[src="${tag.src}"]`)) {
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
    if (!ready || !tag || !isAnalyticsAllowed(choice)) {
      return;
    }
    injectTracker(tag);
  }, [ready, tag, choice]);

  const setAnalytics = useCallback((analytics: boolean) => {
    const serialized = serializeConsent(analytics);
    memoryOverride = parseConsent(serialized) ?? undefined;
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
    } catch {
      // Private mode can refuse localStorage; memoryOverride still closes
      // the banner for this visit.
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
