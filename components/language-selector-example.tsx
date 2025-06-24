"use client"

// Scalable language selector example
// New languages automatically appear in selection options when added

import { useLanguage } from "@/lib/language-context";
import { getAllLanguageInfos, isLanguageSupported } from "@/lib/translations/language-config";
import { Language } from "@/lib/translations";

export function LanguageSelectorExample() {
  const { language, setLanguage } = useLanguage();
  
  // Dynamically get all supported language information
  const languageOptions = getAllLanguageInfos();

  const handleLanguageChange = (selectedLang: string) => {
    // Safe type checking
    if (isLanguageSupported(selectedLang)) {
      setLanguage(selectedLang as Language);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3>Language Selection (Improved Scalability Version)</h3>
      <select 
        value={language} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="p-2 border rounded"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      
      <div className="text-sm text-gray-600">
        <p>Currently selected language: {language}</p>
        <p>Number of supported languages: {languageOptions.length}</p>
      </div>
    </div>
  );
}

// Usage:
// To add a new language (e.g., Korean):
// 1. Add ko: { name: 'Korean', nativeName: '한국어' } to LANGUAGE_CONFIGS in language-config.ts
// 2. Create translations/ko.ts file
// 3. Import and add ko to translations/index.ts
// 
// Then Korean option will automatically appear in this component!
// Hardcoded language checks in language-context.tsx will also work automatically! 