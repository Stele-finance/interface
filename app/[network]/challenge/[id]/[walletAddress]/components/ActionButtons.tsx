import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Repeat, FileText, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
          disabled={isRegistering}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
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
                disabled={isRegistering}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
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

interface RegisteredStatusProps {
  challengeId: string
  onMintNFT: () => void
  isMinting: boolean
  isChallengeEnded: boolean
}

export function RegisteredStatus({ challengeId, onMintNFT, isMinting, isChallengeEnded }: RegisteredStatusProps) {
  const { t } = useLanguage()

  return (
    <TooltipProvider>
      <div className="hidden md:flex w-full gap-3">
        {/* Mint NFT Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default" 
              size="lg" 
              onClick={onMintNFT}
              disabled={isMinting || !isChallengeEnded}
              className="flex-1 h-[51px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Minting...
                </>
              ) : !isChallengeEnded ? (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('mintNFT')}
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('mintNFT')}
                </>
              )}
            </Button>
          </TooltipTrigger>
          {!isChallengeEnded && (
            <TooltipContent>
              <p>Available after challenge ends</p>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Registered Status */}
        <div className="flex-1 bg-green-900/30 border border-green-500/50 rounded-lg px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 font-medium text-base">{t('registered')}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 