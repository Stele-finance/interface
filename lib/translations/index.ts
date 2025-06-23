import { en } from './en';
import { zh } from './zh';
import { es } from './es';

export const translations = {
  en,
  zh,
  es
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; 