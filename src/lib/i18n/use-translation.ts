"use client";

import { useCallback } from "react";
import type { Locale } from "./translations";
import { translate } from "./translations";

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getLocaleFromCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1];
  return value === "en" || value === "tr" ? value : null;
}

export function useTranslation(locale: Locale) {
  const t = useCallback(
    (key: string) => translate(locale, key),
    [locale]
  );
  return { t, locale };
}
