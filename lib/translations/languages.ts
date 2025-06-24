// Language configuration and metadata
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  'zh-cn': {
    code: 'zh-cn',
    name: 'Chinese - Simplified',
    nativeName: '中文 - 简体'
  },
  'zh-tw': {
    code: 'zh-tw',
    name: 'Chinese - Traditional',
    nativeName: '中文 - 繁體'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية'
  },
  bn: {
    code: 'bn',
    name: 'Bangladeshi',
    nativeName: 'বাংলা'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский'
  },
  jp: {
    code: 'jp',
    name: 'Japanese',
    nativeName: '日本語'
  },
  kr: {
    code: 'kr',
    name: 'Korean',
    nativeName: '한국어'
  },
  da: {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk'
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands'
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia'
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