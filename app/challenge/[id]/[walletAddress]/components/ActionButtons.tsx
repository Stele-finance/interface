import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Repeat, FileText, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"

interface ActionButtonsProps {
  connectedAddress: string | null
  walletAddress: string
  isRegistered: boolean
  isSwapMode: boolean
  isRegistering: boolean
  isAssetSwapping: boolean
  onSwapModeToggle: () => void
  onRegister: () => void
}

export function ActionButtons({ 
  connectedAddress, 
  walletAddress, 
  isRegistered, 
  isSwapMode, 
  isRegistering, 
  isAssetSwapping, 
  onSwapModeToggle, 
  onRegister 
}: ActionButtonsProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()

  const canShowButtons = connectedAddress && 
    walletAddress && 
    connectedAddress.toLowerCase() === walletAddress.toLowerCase() && 
    !isRegistered

  if (!canShowButtons) return null

  return (
    <>
      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-3 w-full">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onSwapModeToggle}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
        >
          {isSwapMode ? (
            <>
              <X className="mr-2 h-5 w-5" />
              {t('close')}
            </>
          ) : (
            <>
              <Repeat className="mr-2 h-5 w-5" />
              {t('swap')}
            </>
          )}
        </Button>
        <Button 
          variant="default" 
          size="lg" 
          onClick={onRegister}
          disabled={isRegistering || isAssetSwapping || isSwapMode}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
        >
          {isRegistering ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('registering')}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              {t('register')}
            </>
          )}
        </Button>
      </div>

      {/* Mobile Float Buttons */}
      {!isMobileMenuOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onSwapModeToggle}
                className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
              >
                {isSwapMode ? (
                  <>
                    <X className="mr-2 h-5 w-5" />
                    {t('close')}
                  </>
                ) : (
                  <>
                    <Repeat className="mr-2 h-5 w-5" />
                    {t('swap')}
                  </>
                )}
              </Button>
              <Button 
                variant="default" 
                size="lg" 
                onClick={onRegister}
                disabled={isRegistering || isAssetSwapping || isSwapMode}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('registering')}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    {t('register')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function RegisteredStatus() {
  const { t } = useLanguage()

  return (
    <div className="hidden md:block w-full bg-green-900/30 border border-green-500/50 rounded-lg px-6 py-3">
      <div className="flex items-center justify-center gap-2">
        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-green-400 font-medium text-base">{t('registered')}</span>
      </div>
    </div>
  )
} 