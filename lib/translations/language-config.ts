// Language configuration utility - manage all language settings here when adding new languages

export const LANGUAGE_CONFIGS = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  jp: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIGS;

/**
 * Returns all supported language codes
 * New languages are automatically included when added
 */
export const getSupportedLanguages = (): SupportedLanguage[] => {
  return Object.keys(LANGUAGE_CONFIGS) as SupportedLanguage[];
};

/**
 * Check if a language is supported
 */
export const isLanguageSupported = (lang: string): lang is SupportedLanguage => {
  return lang in LANGUAGE_CONFIGS;
};

/**
 * Get language information
 */
export const getLanguageInfo = (lang: SupportedLanguage) => {
  return LANGUAGE_CONFIGS[lang];
};

/**
 * Get information for all languages (used in language selectors, etc.)
 */
export const getAllLanguageInfos = () => {
  return getSupportedLanguages().map(lang => ({
    code: lang,
    ...getLanguageInfo(lang)
  }));
};

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Usage example:
// To add a new language:
// 1. Add new language to LANGUAGE_CONFIGS
// 2. Import and add new translation file to translations/index.ts
// 3. Create new translation file (e.g., ko.ts)
// Then it will be automatically supported everywhere! 