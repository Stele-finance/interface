// Language configuration and metadata
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦'
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺'
  },
  jp: {
    code: 'jp',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵'
  }
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Get all supported language codes
export const getSupportedLanguages = (): SupportedLanguageCode[] => {
  return Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageCode[];
};

// Check if a language is supported
export const isLanguageSupported = (lang: string): lang is SupportedLanguageCode => {
  return lang in SUPPORTED_LANGUAGES;
};

// Get language metadata
export const getLanguageInfo = (lang: SupportedLanguageCode) => {
  return SUPPORTED_LANGUAGES[lang];
};

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en'; 