'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import en, { type Dictionary } from './en';
import am from './am';

export type Language = 'en' | 'am';

const dictionaries: Record<Language, Dictionary> = { en, am };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: en,
});

/** Replaces `{key}` placeholders in a translated string, e.g. format(t.hero.approxRate, { rate: 123.4 }). */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('language');
      if (stored === 'am' || stored === 'en') {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {}
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    try {
      localStorage.setItem('language', next);
    } catch {}
    document.documentElement.lang = next;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: dictionaries[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
