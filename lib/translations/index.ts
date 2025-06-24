import { en } from './en';
import { zhCn } from './zh-cn';
import { zhTw } from './zh-tw';
import { es } from './es';
import { hi } from './hi';
import { ar } from './ar';
import { bn } from './bn';
import { pt } from './pt';
import { ru } from './ru';
import { jp } from './jp';
import { kr } from './kr';
import { fr } from './fr';
import { de } from './de';
import { da } from './da';
import { nl } from './nl';
import { id } from './id';
import { ms } from './ms';
import { vi } from './vi';

export const translations = {
  en,
  'zh-cn': zhCn,
  'zh-tw': zhTw,
  es,
  hi,
  ar,
  bn,
  pt,
  ru,
  jp,
  kr,
  fr,
  de,
  da,
  nl,
  id,
  ms,
  vi
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en; 