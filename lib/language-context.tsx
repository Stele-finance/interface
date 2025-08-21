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
        // Set default language when auto-detection fails
        setLanguage('en');
        localStorage.setItem('language', 'en');
      }
    } catch (error) {
      console.error('Auto language detection failed:', error);
      // Set default language on network error or other failures
      setLanguage('en');
      localStorage.setItem('language', 'en');
    }
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
    return (translations[language] as any)[key] || (translations.en as any)[key] || key;
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