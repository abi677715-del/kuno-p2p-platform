'use client';

import { useLanguage } from '@/lib/i18n/context';

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const next = language === 'en' ? 'am' : 'en';

  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      aria-label={language === 'en' ? t.header.switchToAmharic : t.header.switchToEnglish}
      title={language === 'en' ? t.header.switchToAmharic : t.header.switchToEnglish}
      className="h-8 px-2.5 shrink-0 rounded-full border border-white/15 flex items-center justify-center text-xs font-medium text-muted hover:border-white/30 hover:text-paper transition-colors"
    >
      {language === 'en' ? 'አማ' : 'EN'}
    </button>
  );
}
