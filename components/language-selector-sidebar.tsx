"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Languages, Check, Globe } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Language } from "@/lib/translations"

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  description: string;
}

const languages: LanguageOption[] = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸', 
    region: 'North America',
    description: 'Global business language'
  },
  { 
    code: 'zh', 
    name: 'Chinese', 
    nativeName: '中文', 
    flag: '🇨🇳', 
    region: 'East Asia',
    description: 'Simplified Chinese'
  },
  { 
    code: 'es', 
    name: 'Spanish', 
    nativeName: 'Español', 
    flag: '🇪🇸', 
    region: 'Europe & Americas',
    description: 'Castilian Spanish'
  },
  { 
    code: 'hi', 
    name: 'Hindi', 
    nativeName: 'हिंदी', 
    flag: '🇮🇳', 
    region: 'South Asia',
    description: 'Hindi language'
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    flag: '🇸🇦', 
    region: 'Middle East',
    description: 'Arabic (Saudi Arabia)'
  },
];

interface LanguageSelectorSidebarProps {
  children?: React.ReactNode;
}

export function LanguageSelectorSidebar({ children }: LanguageSelectorSidebarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageSelect = (languageCode: Language) => {
    setLanguage(languageCode);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5" />
            {t('language')}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Current Language Section */}
          {currentLanguage && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Current Language
              </h3>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentLanguage.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{currentLanguage.name}</span>
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentLanguage.nativeName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentLanguage.region}</p>
                  </div>
                  <Check className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Available Languages Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Available Languages
            </h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleLanguageSelect(lang.code)}
                  disabled={language === lang.code}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lang.name}</span>
                        {language === lang.code && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      <p className="text-xs text-muted-foreground">{lang.region}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">{lang.description}</p>
                    </div>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Settings are saved in your browser</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 