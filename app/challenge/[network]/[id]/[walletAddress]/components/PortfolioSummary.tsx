import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/language-context"
import { PortfolioMetrics, RealTimePortfolio } from "../types"
import Image from "next/image"
import { User } from "lucide-react"

interface PortfolioSummaryProps {
  portfolioMetrics: PortfolioMetrics
  realTimePortfolio: RealTimePortfolio | null
  isLoadingUniswap: boolean
  challengeData: any
  network: string
  investorData: any
  walletAddress: string
  currentTime: Date
  isClient: boolean
}

export function PortfolioSummary({
  portfolioMetrics,
  realTimePortfolio,
  isLoadingUniswap,
  challengeData,
  network,
  investorData,
  walletAddress,
  currentTime,
  isClient
}: PortfolioSummaryProps) {
  const { t } = useLanguage()
  const { currentValue, formattedSeedMoney, gainLoss, gainLossPercentage, isPositive } = portfolioMetrics

  // Get challenge status
  const getChallengeStatus = () => {
    if (!isClient || !challengeData?.challenge) return { text: t('loading'), color: 'text-gray-400' };

    const challenge = challengeData.challenge;
    const endTime = new Date(parseInt(challenge.endTime) * 1000);
    const hasEnded = currentTime >= endTime;

    if (challenge.isActive && !hasEnded) {
      return { text: t('active'), color: 'text-green-400' };
    } else if (challenge.isActive && hasEnded) {
      return { text: t('pending'), color: 'text-orange-400' };
    } else {
      return { text: t('end'), color: 'text-gray-400' };
    }
  };

  const challengeStatus = getChallengeStatus();

  // Check if challenge has ended
  const isChallengeEnded = challengeStatus.text === t('end');

  // Mobile tooltip state management
  const [showTypeTooltip, setShowTypeTooltip] = useState(false)
  const [showStatusTooltip, setShowStatusTooltip] = useState(false)
  const [showOnChainTooltip, setShowOnChainTooltip] = useState(false)
  const [showLiveTooltip, setShowLiveTooltip] = useState(false)
  const [typeTooltipTimer, setTypeTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [statusTooltipTimer, setStatusTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [onChainTooltipTimer, setOnChainTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [liveTooltipTimer, setLiveTooltipTimer] = useState<NodeJS.Timeout | null>(null)

  // Handle interactions to close mobile tooltips
  useEffect(() => {
    const closeAllTooltips = () => {
      if (showTypeTooltip || showStatusTooltip || showOnChainTooltip || showLiveTooltip) {
        setShowTypeTooltip(false);
        setShowStatusTooltip(false);
        setShowOnChainTooltip(false);
        setShowLiveTooltip(false);
        // Clear timers when closing tooltips
        if (typeTooltipTimer) {
          clearTimeout(typeTooltipTimer);
          setTypeTooltipTimer(null);
        }
        if (statusTooltipTimer) {
          clearTimeout(statusTooltipTimer);
          setStatusTooltipTimer(null);
        }
        if (onChainTooltipTimer) {
          clearTimeout(onChainTooltipTimer);
          setOnChainTooltipTimer(null);
        }
        if (liveTooltipTimer) {
          clearTimeout(liveTooltipTimer);
          setLiveTooltipTimer(null);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      closeAllTooltips();
    };

    const handleTouchStart = (event: TouchEvent) => {
      closeAllTooltips();
    };

    const handleTouchMove = (event: TouchEvent) => {
      closeAllTooltips();
    };

    const handleScroll = () => {
      closeAllTooltips();
    };

    const handleWheel = () => {
      closeAllTooltips();
    };

    if (showTypeTooltip || showStatusTooltip || showOnChainTooltip || showLiveTooltip) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTypeTooltip, showStatusTooltip, showOnChainTooltip, showLiveTooltip, typeTooltipTimer, statusTooltipTimer, onChainTooltipTimer, liveTooltipTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typeTooltipTimer) {
        clearTimeout(typeTooltipTimer);
      }
      if (statusTooltipTimer) {
        clearTimeout(statusTooltipTimer);
      }
      if (onChainTooltipTimer) {
        clearTimeout(onChainTooltipTimer);
      }
      if (liveTooltipTimer) {
        clearTimeout(liveTooltipTimer);
      }
    };
  }, [typeTooltipTimer, statusTooltipTimer, onChainTooltipTimer, liveTooltipTimer]);

  // Helper function to handle tooltip click for both mobile and desktop
  const handleTooltipClick = (
    e: React.MouseEvent,
    tooltipType: 'type' | 'status' | 'onchain' | 'live',
    currentShow: boolean,
    setShow: (show: boolean) => void,
    currentTimer: NodeJS.Timeout | null,
    setTimer: (timer: NodeJS.Timeout | null) => void
  ) => {
    e.stopPropagation();
    
    // Clear existing timer
    if (currentTimer) {
      clearTimeout(currentTimer);
      setTimer(null);
    }
    
    if (!currentShow) {
      // Show tooltip
      setShow(true);
      
      // Auto-close after 3 seconds only for mobile
      if (!window.matchMedia('(hover: hover)').matches) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimer(null);
        }, 3000);
        setTimer(timer);
      }
    } else {
      // Hide tooltip
      setShow(false);
    }
  };

  // Helper function to handle mouse leave for desktop
  const handleMouseLeave = (
    setShow: (show: boolean) => void,
    currentTimer: NodeJS.Timeout | null,
    setTimer: (timer: NodeJS.Timeout | null) => void
  ) => {
    // Only trigger on desktop (devices with hover capability)
    if (window.matchMedia('(hover: hover)').matches) {
      // Clear any existing timer
      if (currentTimer) {
        clearTimeout(currentTimer);
        setTimer(null);
      }
      // Hide tooltip immediately on mouse leave
      setShow(false);
    }
  };

  // Note: Using click-only approach for both desktop and mobile to prevent flickering issues

  return (
    <Card className="bg-muted/30 border border-gray-700/50 rounded-2xl">
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
            <span className="text-sm text-gray-400">{t('network')}</span>
            <div className="flex items-center gap-2">
              <Image 
                src={network === 'arbitrum' ? '/networks/small/arbitrum.png' : '/networks/small/ethereum.png'}
                alt={network}
                width={16}
                height={16}
                className="rounded-full"
              />
              <span className="text-sm text-white font-medium">
                {network === 'ethereum' ? 'Mainnet' : network === 'arbitrum' ? 'Arbitrum' : 'Mainnet'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
            <span className="text-sm text-gray-400">{t('status')}</span>
            <div className="flex items-center gap-2">
              {challengeStatus.text === t('active') && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
              {challengeStatus.text === t('pending') && (
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              )}
              <span className={`text-sm font-medium ${challengeStatus.color}`}>{challengeStatus.text}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
            <span className="text-sm text-gray-400">{t('investor')}</span>
            <span className="text-sm text-white font-medium">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
          
          <div className="py-2">
            <div className="flex justify-between">
              <div>
                <span className="text-sm text-gray-400 block">{t('onChainValue')}</span>
                {/* Real-time portfolio value - only show if challenge is not ended */}
                {!isChallengeEnded && realTimePortfolio && (
                  <div className="mt-1">
                    {(() => {
                      const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                      const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                      const isRealTimePositive = realTimeGainLoss >= 0

                      return (
                        <TooltipProvider>
                          <Tooltip open={showLiveTooltip}>
                            <TooltipTrigger asChild>
                              <div
                                className={`text-sm inline-flex items-center gap-1 cursor-pointer ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}
                                onClick={(e) => handleTooltipClick(
                                  e,
                                  'live',
                                  showLiveTooltip,
                                  setShowLiveTooltip,
                                  liveTooltipTimer,
                                  setLiveTooltipTimer
                                )}
                                onMouseLeave={() => handleMouseLeave(setShowLiveTooltip, liveTooltipTimer, setLiveTooltipTimer)}
                              >
                                <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                                <span>{t('live')}:</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">{t('tooltipLiveValue')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <TooltipProvider>
                  <Tooltip open={showOnChainTooltip}>
                    <TooltipTrigger asChild>
                      <div
                        className="cursor-pointer"
                        onClick={(e) => handleTooltipClick(
                          e,
                          'onchain',
                          showOnChainTooltip,
                          setShowOnChainTooltip,
                          onChainTooltipTimer,
                          setOnChainTooltipTimer
                        )}
                        onMouseLeave={() => handleMouseLeave(setShowOnChainTooltip, onChainTooltipTimer, setOnChainTooltipTimer)}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-white font-medium">
                            ${(Math.floor(currentValue * 100) / 100).toFixed(2)}
                          </span>
                          <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            ({isPositive ? '+' : ''}{(Math.floor(gainLossPercentage * 10000) / 10000).toFixed(4)}%)
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{t('tooltipOnChainValue')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Real-time portfolio value - right side - only show if challenge is not ended */}
                {!isChallengeEnded && realTimePortfolio && (
                  <div className="mt-1">
                    {(() => {
                      const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                      const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                      const isRealTimePositive = realTimeGainLoss >= 0

                      return (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-white font-medium">
                            ${(Math.floor(realTimePortfolio.totalValue * 100) / 100).toFixed(2)}
                          </span>
                          <span className={`text-sm ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}>
                            ({isRealTimePositive ? '+' : ''}{(Math.floor(realTimeGainLossPercentage * 10000) / 10000).toFixed(4)}%)
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 