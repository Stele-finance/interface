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
}

export function PortfolioSummary({ 
  portfolioMetrics, 
  realTimePortfolio, 
  isLoadingUniswap, 
  challengeData, 
  network, 
  investorData 
}: PortfolioSummaryProps) {
  const { t } = useLanguage()
  const { currentValue, formattedSeedMoney, gainLoss, gainLossPercentage, isPositive } = portfolioMetrics

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
    <Card className="bg-muted border-0 rounded-2xl">
      <CardContent className="p-8 space-y-8">
        {/* Row 1: Type and Status */}
        <div className="grid grid-cols-2 gap-6">
          {/* Network */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('network')}</span>
              <div className="flex items-center gap-3">
               {network === 'ethereum' ? (
                 <>
                   <Image 
                     src="/networks/small/ethereum.png" 
                     alt="Ethereum Mainnet"
                     width={24}
                     height={24}
                     className="rounded-full"
                     style={{ width: '24px', height: '24px' }}
                   />
                   <span className="text-xl text-white">Mainnet</span>
                 </>
               ) : network === 'arbitrum' ? (
                 <>
                   <Image 
                     src="/networks/small/arbitrum.png" 
                     alt="Arbitrum One"
                     width={24}
                     height={24}
                     className="rounded-full"
                     style={{ width: '24px', height: '24px' }}
                   />
                   <span className="text-xl text-white">Arbitrum</span>
                 </>
               ) : (
                 <>
                   <Image 
                     src="/networks/small/ethereum.png" 
                     alt="Ethereum Mainnet"
                     width={24}
                     height={24}
                     className="rounded-full"
                     style={{ width: '24px', height: '24px' }}
                   />
                   <span className="text-xl text-white">Mainnet</span>
                 </>
               )}
             </div>
          </div>
          
          {/* Register */}
          <div className="space-y-2 ml-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-base text-gray-400">{t('register')}</span>
            </div>
            <div className="flex items-right gap-2 ml-4">
              <span 
                className={`text-xl font-medium ${investorData?.investor?.isRegistered === true ? 'text-green-400' : 'text-gray-400'}`}
              >
                {investorData?.investor?.isRegistered === true ? t('yes') : t('no')}
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="space-y-2">
          <span className="text-base text-gray-400">{t('onChainValue')}</span>
          <TooltipProvider>
            <Tooltip open={showOnChainTooltip}>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-baseline gap-1 cursor-pointer"
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
                  <div className="text-4xl text-white">
                    ${currentValue.toFixed(2)}
                  </div>
                  <div className={`text-base ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    ({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{t('tooltipOnChainValue')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Real-time portfolio value */}
          {realTimePortfolio && (
            <div className="space-y-1">
              {(() => {
                const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                const isRealTimePositive = realTimeGainLoss >= 0
                
                return (
                  <TooltipProvider>
                    <Tooltip open={showLiveTooltip}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`text-base flex items-center gap-2 cursor-pointer ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}
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
                          <span className="w-3 h-3 bg-current rounded-full animate-pulse"></span>
                          {t('live')}: ${realTimePortfolio.totalValue.toFixed(2)} ({isRealTimePositive ? '+' : ''}{realTimeGainLossPercentage.toFixed(2)}%)
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
      </CardContent>
    </Card>
  )
} 