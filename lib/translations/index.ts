import { en } from './en';
import { zh } from './zh';

export const translations = {
  en,
  zh
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; 