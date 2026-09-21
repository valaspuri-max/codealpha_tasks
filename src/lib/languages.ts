export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'fr' | 'es';

export interface Language {
  code: LanguageCode;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'hi', label: 'Hindi', flag: 'HI' },
  { code: 'te', label: 'Telugu', flag: 'TE' },
  { code: 'ta', label: 'Tamil', flag: 'TA' },
  { code: 'fr', label: 'French', flag: 'FR' },
  { code: 'es', label: 'Spanish', flag: 'ES' },
];

export const LANGUAGE_MAP: Record<LanguageCode, Language> = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = lang;
    return acc;
  },
  {} as Record<LanguageCode, Language>
);
