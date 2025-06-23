# Translation System

This directory contains the internationalization (i18n) system for the application.

## Supported Languages

- **English** (`en`) - Default language
- **Chinese** (`zh`) - 中文
- **Spanish** (`es`) - Español

## File Structure

```
lib/translations/
├── index.ts          # Main export file
├── en.ts            # English translations
├── zh.ts            # Chinese translations
├── es.ts            # Spanish translations
└── README.md        # This file
```

## Usage

### Using translations in components

```tsx
import { useLanguage } from "@/lib/language-context"

export function MyComponent() {
  const { t, language, setLanguage } = useLanguage()
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button onClick={() => setLanguage('es')}>
        {t('spanish')}
      </button>
    </div>
  )
}
```

### Adding new translation keys

1. Add the key to `en.ts` (English is the source of truth)
2. Add the same key with translations to `zh.ts` and `es.ts`
3. The TypeScript system will ensure all languages have the same keys

Example:
```ts
// en.ts
export const en = {
  // ... existing keys
  newFeature: "New Feature",
  // ... more keys
} as const;

// zh.ts
export const zh = {
  // ... existing keys
  newFeature: "新功能",
  // ... more keys
} as const;

// es.ts
export const es = {
  // ... existing keys
  newFeature: "Nueva Función",
  // ... more keys
} as const;
```

## Language Context

The language context provides:
- `t(key)`: Translation function
- `language`: Current language code
- `setLanguage(lang)`: Function to change language

The language preference is automatically saved to localStorage.

## Supported Languages in UI

Users can switch languages through the header dropdown menu:
- English (English)
- 中文 (Chinese)
- Español (Spanish)

## Type Safety

The translation system is fully type-safe:
- `TranslationKey` type ensures only valid keys can be used
- `Language` type restricts language codes to supported ones
- TypeScript will warn if a key exists in one language but not others

## Adding a New Language

1. Create a new translation file (e.g., `fr.ts` for French)
2. Copy all keys from `en.ts` and translate the values
3. Add the new language to `index.ts`:
   ```ts
   import { fr } from './fr';
   
   export const translations = {
     en,
     zh,
     es,
     fr  // Add new language
   } as const;
   ```
4. Update the language validation in `language-context.tsx`
5. Add the language option to the header dropdown
6. Add the language name translation to all existing language files

## Translation Guidelines

- Keep translations concise and clear
- Use consistent terminology across the application
- Consider cultural context, not just literal translation
- Test translations in the UI to ensure they fit properly
- Use proper punctuation and capitalization for each language

## Current Translation Count

The system currently includes **289 translation keys** covering:
- Navigation and UI elements
- Form labels and buttons
- Status messages and notifications
- Error messages and loading states
- Financial and trading terminology
- Governance and voting interface
- Challenge and portfolio features 