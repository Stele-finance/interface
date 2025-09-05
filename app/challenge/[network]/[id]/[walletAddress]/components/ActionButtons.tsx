import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Repeat, FileText, X, Gift, Award } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionButtonsProps {
  connectedAddress: string | null
  walletAddress: string
  challengeState: 'active' | 'pending' | 'end' | 'unknown'
  userInTop5: boolean
  hasNFTMinted: boolean
  isSwapMode: boolean
  isRegistering: boolean
  isAssetSwapping: boolean
  isMinting: boolean
  onSwapModeToggle: () => void
  onRegister: () => void
  onMintNFT: () => void
  onGetReward?: () => void
}

export function ActionButtons({ 
  connectedAddress, 
  walletAddress, 
  challengeState,
  userInTop5,
  hasNFTMinted,
  isSwapMode, 
  isRegistering, 
  isAssetSwapping,
  isMinting,
  onSwapModeToggle, 
  onRegister,
  onMintNFT,
  onGetReward
}: ActionButtonsProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()

  // Check if connected wallet matches the page user
  const isCorrectWallet = connectedAddress && 
    walletAddress && 
    connectedAddress.toLowerCase() === walletAddress.toLowerCase()

  // Active State: Show swap + register buttons only if correct wallet
  if (challengeState === 'active') {
    if (!isCorrectWallet) return null

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
  
  // Pending State
  if (challengeState === 'pending') {
    if (isCorrectWallet) {
      // Same wallet: show getrewards + mint nft (if in top 5)
      return (
        <>
          {/* Desktop Buttons */}
          <div className="hidden md:flex gap-3 w-full">
            {onGetReward && (
              <Button 
                variant="default" 
                size="lg" 
                onClick={onGetReward}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
              >
                <Gift className="mr-2 h-5 w-5" />
                {t('getReward')}
              </Button>
            )}
            {userInTop5 && (
              <Button 
                variant="default" 
                size="lg" 
                onClick={onMintNFT}
                disabled={isMinting || hasNFTMinted}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('minting')}...
                  </>
                ) : hasNFTMinted ? (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    NFT Minted
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    {t('mintNFT')}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mobile Float Buttons */}
          {!isMobileMenuOpen && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
              <div className="p-4">
                <div className={`grid gap-3 ${onGetReward && userInTop5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {onGetReward && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      onClick={onGetReward}
                      className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      <Gift className="mr-2 h-5 w-5" />
                      {t('getReward')}
                    </Button>
                  )}
                  {userInTop5 && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      onClick={onMintNFT}
                      disabled={isMinting || hasNFTMinted}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('minting')}...
                        </>
                      ) : hasNFTMinted ? (
                        <>
                          <Award className="mr-2 h-5 w-5" />
                          NFT Minted
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-5 w-5" />
                          {t('mintNFT')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )
    } else {
      // Different wallet: show only getrewards button
      if (!onGetReward) return null
      
      return (
        <>
          {/* Desktop Button */}
          <div className="hidden md:flex w-full">
            <Button 
              variant="default" 
              size="lg" 
              onClick={onGetReward}
              className="w-full bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
            >
              <Gift className="mr-2 h-5 w-5" />
              {t('getReward')}
            </Button>
          </div>

          {/* Mobile Button */}
          {!isMobileMenuOpen && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
              <div className="p-4">
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={onGetReward}
                  className="w-full bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                >
                  <Gift className="mr-2 h-5 w-5" />
                  {t('getReward')}
                </Button>
              </div>
            </div>
          )}
        </>
      )
    }
  }

  // End State: Show only mint NFT if correct wallet and in top 5
  if (challengeState === 'end') {
    if (!isCorrectWallet || !userInTop5) return null

    return (
      <>
        {/* Desktop Button */}
        <div className="hidden md:flex w-full">
          <Button 
            variant="default" 
            size="lg" 
            onClick={onMintNFT}
            disabled={isMinting || hasNFTMinted}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('minting')}...
              </>
            ) : hasNFTMinted ? (
              <>
                <Award className="mr-2 h-5 w-5" />
                NFT Minted
              </>
            ) : (
              <>
                <Award className="mr-2 h-5 w-5" />
                {t('mintNFT')}
              </>
            )}
          </Button>
        </div>

        {/* Mobile Button */}
        {!isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4">
              <Button 
                variant="default" 
                size="lg" 
                onClick={onMintNFT}
                disabled={isMinting || hasNFTMinted}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('minting')}...
                  </>
                ) : hasNFTMinted ? (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    NFT Minted
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    {t('mintNFT')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Unknown state or no conditions met
  return null
}

// Keep the original RegisteredStatus for compatibility (though it may not be used)
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
      <div className="hidden md:flex w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default" 
              size="lg" 
              onClick={onMintNFT}
              disabled={isMinting || !isChallengeEnded}
              className="w-full h-[51px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-5 w-5" />
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
      </div>
    </TooltipProvider>
  )
}