"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  isAutoDetected: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from localStorage on mount or auto-detect from IP
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('language') as Language;
        const hasManuallySelected = localStorage.getItem('language-manually-selected') === 'true';
        
        // If user has manually selected a language, use it
        if (hasManuallySelected && savedLanguage && Object.keys(translations).includes(savedLanguage)) {
          setLanguage(savedLanguage);
          setIsInitialized(true);
          return;
        }
        
        // If no manual selection, try to auto-detect from IP
        if (!hasManuallySelected) {
          await autoDetectLanguage();
        } else if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
          setLanguage(savedLanguage);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  // Auto-detect language based on IP
  const autoDetectLanguage = async () => {
    try {
      const response = await fetch('/api/detect-language', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache prevention
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.language && Object.keys(translations).includes(data.language)) {
        setLanguage(data.language as Language);
        setIsAutoDetected(true);
        localStorage.setItem('language', data.language);
        
        // Only output console log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log(`Language automatically set to ${data.language} (Country: ${data.country})`);
        }
      } else {
        // If IP detection failed, try browser language fallback
        const browserLanguage = getBrowserLanguage();
        if (browserLanguage && Object.keys(translations).includes(browserLanguage)) {
          setLanguage(browserLanguage as Language);
          setIsAutoDetected(true);
          localStorage.setItem('language', browserLanguage);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Language automatically set to ${browserLanguage} (Browser fallback)`);
          }
        } else {
          // Set default language when both IP and browser detection fail
          setLanguage('en');
          localStorage.setItem('language', 'en');
        }
      }
    } catch (error) {
      console.error('Auto language detection failed:', error);
      // Try browser language fallback on network error
      const browserLanguage = getBrowserLanguage();
      if (browserLanguage && Object.keys(translations).includes(browserLanguage)) {
        setLanguage(browserLanguage as Language);
        setIsAutoDetected(true);
        localStorage.setItem('language', browserLanguage);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Language automatically set to ${browserLanguage} (Browser fallback after IP error)`);
        }
      } else {
        // Set default language on network error or other failures
        setLanguage('en');
        localStorage.setItem('language', 'en');
      }
    }
  };

  // Get browser language and map to supported language codes
  const getBrowserLanguage = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const browserLang = navigator.language || navigator.languages[0];
    if (!browserLang) return null;
    
    const langCode = browserLang.toLowerCase();
    
    // Direct mapping for exact matches
    const langMap: { [key: string]: string } = {
      'en': 'en',
      'en-us': 'en',
      'en-gb': 'en',
      'ko': 'kr',
      'ko-kr': 'kr',
      'ja': 'jp',
      'ja-jp': 'jp',
      'zh': 'zh-cn',
      'zh-cn': 'zh-cn',
      'zh-tw': 'zh-tw',
      'zh-hk': 'zh-tw',
      'es': 'es',
      'es-es': 'es',
      'es-mx': 'es',
      'pt': 'pt',
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'fr': 'fr',
      'fr-fr': 'fr',
      'de': 'de',
      'de-de': 'de',
      'it': 'it',
      'it-it': 'it',
      'ru': 'ru',
      'ru-ru': 'ru',
      'ar': 'ar',
      'hi': 'hi',
      'hi-in': 'hi',
      'bn': 'bn',
      'bn-bd': 'bn',
      'id': 'id',
      'id-id': 'id',
      'ms': 'ms',
      'ms-my': 'ms',
      'th': 'th',
      'th-th': 'th',
      'vi': 'vi',
      'vi-vn': 'vi',
      'nl': 'nl',
      'nl-nl': 'nl',
      'da': 'da',
      'da-dk': 'da',
      'fi': 'fi',
      'fi-fi': 'fi',
      'el': 'el',
      'el-gr': 'el',
      'he': 'he',
      'he-il': 'he',
      'hu': 'hu',
      'hu-hu': 'hu'
    };
    
    // Check exact match first
    if (langMap[langCode]) {
      return langMap[langCode];
    }
    
    // Check partial match (e.g., 'en-au' -> 'en')
    const baseLang = langCode.split('-')[0];
    if (langMap[baseLang]) {
      return langMap[baseLang];
    }
    
    return null;
  };

  // Save language to localStorage when it changes
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('language-manually-selected', 'true');
    setIsAutoDetected(false);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isAutoDetected }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 