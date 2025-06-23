import { en } from './en';
import { zh } from './zh';
import { es } from './es';
import { hi } from './hi';

export const translations = {
  en,
  zh,
  es,
  hi
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; 