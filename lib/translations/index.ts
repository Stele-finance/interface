import { en } from './en';
import { zh } from './zh';
import { es } from './es';
import { hi } from './hi';
import { ar } from './ar';
import { bn } from './bn';
import { pt } from './pt';
import { ru } from './ru';

export const translations = {
  en,
  zh,
  es,
  hi,
  ar,
  bn,
  pt,
  ru
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; 