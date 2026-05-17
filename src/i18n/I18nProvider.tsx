import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { TRANSLATIONS, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "./config";

interface I18nContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: readonly typeof SUPPORTED_LANGUAGES;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "enterprise_language";

function normalizeLanguage(lang: string): string {
  const exactMatch = SUPPORTED_LANGUAGES.find(
    (item) => item.code === lang,
  )?.code;
  if (exactMatch) return exactMatch;

  const base = lang.split("-")[0]?.toLowerCase();
  if (!base) return DEFAULT_LANGUAGE;

  const baseMatch = SUPPORTED_LANGUAGES.find((item) =>
    item.code.toLowerCase().startsWith(base),
  );
  return baseMatch?.code || DEFAULT_LANGUAGE;
}

function loadLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLanguage(saved);
    const browserLanguage =
      typeof navigator !== "undefined" ? navigator.language : DEFAULT_LANGUAGE;
    return normalizeLanguage(browserLanguage);
  } catch {}
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(loadLanguage);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: string) => {
    const nextLanguage = normalizeLanguage(lang);
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict =
        TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE] || {};
      let text = dict[key] || TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
        });
      }
      return text;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      isReady,
    }),
    [language, setLanguage, t, isReady],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useTranslation() {
  return useI18n();
}
