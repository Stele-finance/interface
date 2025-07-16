"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Languages, Check, Globe } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Language } from "@/lib/translations"
import { getAllLanguageInfos } from "@/lib/translations/language-config"

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

// Get language details from config
const getLanguageDetails = (): LanguageOption[] => {
  const baseLanguages = getAllLanguageInfos();

  return baseLanguages.map(lang => ({
    code: lang.code as Language,
    name: lang.name,
    nativeName: lang.nativeName
  }));
};

interface LanguageSelectorSidebarProps {
  children?: React.ReactNode;
}

export function LanguageSelectorSidebar({ children }: LanguageSelectorSidebarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  
  const languages = getLanguageDetails();
  const currentLanguage = languages.find((lang: LanguageOption) => lang.code === language);

  const handleLanguageSelect = (languageCode: Language) => {
    setLanguage(languageCode);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-64 sm:w-72 flex flex-col bg-muted border-gray-600">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5" />
            {t('language')}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-6 pr-4">
          {/* Current Language Section */}
          {currentLanguage && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Current Language
              </h3>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{currentLanguage.name}</span>
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentLanguage.nativeName}</p>
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
              {languages.map((lang: LanguageOption) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleLanguageSelect(lang.code)}
                  disabled={language === lang.code}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lang.name}</span>
                        {language === lang.code && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 