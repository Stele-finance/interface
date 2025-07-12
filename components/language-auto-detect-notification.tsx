"use client"

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Globe, X } from 'lucide-react';

export function LanguageAutoDetectNotification() {
  const { language, isAutoDetected, t } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isAutoDetected) {
      setShowNotification(true);
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAutoDetected]);

  if (!showNotification || !isAutoDetected) return null;

  const getLanguageName = (lang: string) => {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'kr': '한국어',
      'jp': '日本語',
      'zh-cn': '简体中文',
      'zh-tw': '繁體中文',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'hi': 'हिन्दी',
      'ar': 'العربية',
      'bn': 'বাংলা',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'nl': 'Nederlands',
      'da': 'Dansk',
      'fi': 'Suomi',
      'el': 'Ελληνικά',
      'he': 'עברית',
      'hu': 'Magyar',
    };
    return languageNames[lang] || lang;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="shadow-lg border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
        <Globe className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {language === 'kr' ? 
              `언어가 자동으로 ${getLanguageName(language)}로 설정되었습니다` :
              `Language automatically set to ${getLanguageName(language)}`
            }
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
            className="h-auto p-1 text-blue-600 hover:text-blue-800 dark:text-blue-300"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
} 