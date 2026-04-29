import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext, translate, type Locale } from "@/runtime/i18n";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("forge.locale") as Locale | null;
    return stored ?? "en";
  });

  useEffect(() => {
    localStorage.setItem("forge.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t: (k: string) => translate(locale, k) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};