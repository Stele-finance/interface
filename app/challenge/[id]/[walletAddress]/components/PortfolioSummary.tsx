import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/language-context"
import { PortfolioMetrics, RealTimePortfolio } from "../types"
import Image from "next/image"

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

  // Helper function to handle tooltip click for mobile
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
      
      // Auto-close after 2 seconds on mobile
      if (!window.matchMedia('(hover: hover)').matches) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimer(null);
        }, 2000);
        setTimer(timer);
      }
    } else {
      // Hide tooltip
      setShow(false);
    }
  };

  // Helper function to handle tooltip hover for desktop
  const handleTooltipHover = (
    show: boolean,
    tooltipType: 'type' | 'status' | 'onchain' | 'live',
    setShow: (show: boolean) => void
  ) => {
    // Only trigger on desktop (devices with hover capability)
    if (window.matchMedia('(hover: hover)').matches) {
      setShow(show);
    }
  };

  return (
    <Card className="bg-muted border-0 rounded-2xl">
      <CardContent className="p-8 space-y-8">
        {/* Row 1: Type and Status */}
        <div className="grid grid-cols-2 gap-6">
          {/* Type */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('type')}</span>
            <TooltipProvider>
              <Tooltip open={showTypeTooltip}>
                <TooltipTrigger asChild>
                  <div 
                    className="text-3xl text-white cursor-pointer"
                    onClick={(e) => handleTooltipClick(
                      e, 
                      'type', 
                      showTypeTooltip, 
                      setShowTypeTooltip, 
                      typeTooltipTimer, 
                      setTypeTooltipTimer
                    )}
                    onMouseEnter={() => handleTooltipHover(true, 'type', setShowTypeTooltip)}
                    onMouseLeave={() => handleTooltipHover(false, 'type', setShowTypeTooltip)}
                  >
                    {(() => {
                      const challengeType = challengeData?.challenge?.challengeType
                      switch (challengeType) {
                        case 0:
                          return t('oneWeek');
                        case 1:
                          return t('oneMonth');
                        case 2:
                          return t('threeMonths');
                        case 3:
                          return t('sixMonths');
                        case 4:
                          return t('oneYear');
                        default:
                          return challengeType !== undefined ? `Type ${challengeType}` : `Type Unknown`;
                      }
                    })()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Challenge period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('status')}</span>
            <div className="flex items-center gap-2">
              {(() => {
                // Always show network icon regardless of status
                const networkIcon = network === 'ethereum' ? (
                  <Image 
                    src="/networks/small/ethereum.png" 
                    alt="Ethereum Mainnet"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : network === 'arbitrum' ? (
                  <Image 
                    src="/networks/small/arbitrum.png" 
                    alt="Arbitrum One"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : (
                  // Default to Ethereum icon if network is not recognized
                  <Image 
                    src="/networks/small/ethereum.png" 
                    alt="Ethereum Mainnet"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                );

                // If investor is closed, show as End
                if (investorData?.investor?.isRegistered === true) {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={showStatusTooltip}>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xl text-gray-400 cursor-pointer"
                              onClick={(e) => handleTooltipClick(
                                e,
                                'status',
                                showStatusTooltip,
                                setShowStatusTooltip,
                                statusTooltipTimer,
                                setStatusTooltipTimer
                              )}
                              onMouseEnter={() => handleTooltipHover(true, 'status', setShowStatusTooltip)}
                              onMouseLeave={() => handleTooltipHover(false, 'status', setShowStatusTooltip)}
                            >
                              {t('end')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <p><strong>Active:</strong> Challenge in progress</p>
                              <p><strong>Pending:</strong> Challenge period ends, waiting for reward distribution</p>
                              <p><strong>End:</strong> Challenge reward distribution completed. Completely closed</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )
                }
                // Otherwise show challenge status based on time and isActive
                if (!challengeData?.challenge) {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={showStatusTooltip}>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xl text-gray-400 cursor-pointer"
                              onClick={(e) => handleTooltipClick(
                                e,
                                'status',
                                showStatusTooltip,
                                setShowStatusTooltip,
                                statusTooltipTimer,
                                setStatusTooltipTimer
                              )}
                              onMouseEnter={() => handleTooltipHover(true, 'status', setShowStatusTooltip)}
                              onMouseLeave={() => handleTooltipHover(false, 'status', setShowStatusTooltip)}
                            >
                              {t('end')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <p><strong>Active:</strong> Challenge in progress</p>
                              <p><strong>Pending:</strong> Challenge period ends, waiting for reward distribution</p>
                              <p><strong>End:</strong> Challenge reward distribution completed. Completely closed</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )
                }
                
                const challenge = challengeData.challenge
                const endTime = new Date(parseInt(challenge.endTime) * 1000)
                const hasEnded = new Date() >= endTime
                
                if (challenge.isActive && !hasEnded) {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={showStatusTooltip}>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xl text-green-400 cursor-pointer"
                              onClick={(e) => handleTooltipClick(
                                e,
                                'status',
                                showStatusTooltip,
                                setShowStatusTooltip,
                                statusTooltipTimer,
                                setStatusTooltipTimer
                              )}
                              onMouseEnter={() => handleTooltipHover(true, 'status', setShowStatusTooltip)}
                              onMouseLeave={() => handleTooltipHover(false, 'status', setShowStatusTooltip)}
                            >
                              {t('active')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <p><strong>Active:</strong> Challenge in progress</p>
                              <p><strong>Pending:</strong> Challenge period ends, waiting for reward distribution</p>
                              <p><strong>End:</strong> Challenge reward distribution completed. Completely closed</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )
                } else if (challenge.isActive && hasEnded) {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={showStatusTooltip}>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xl text-orange-400 cursor-pointer"
                              onClick={(e) => handleTooltipClick(
                                e,
                                'status',
                                showStatusTooltip,
                                setShowStatusTooltip,
                                statusTooltipTimer,
                                setStatusTooltipTimer
                              )}
                              onMouseEnter={() => handleTooltipHover(true, 'status', setShowStatusTooltip)}
                              onMouseLeave={() => handleTooltipHover(false, 'status', setShowStatusTooltip)}
                            >
                              {t('pending')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <p><strong>Active:</strong> Challenge in progress</p>
                              <p><strong>Pending:</strong> Challenge period ends, waiting for reward distribution</p>
                              <p><strong>End:</strong> Challenge reward distribution completed. Completely closed</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )
                } else {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={showStatusTooltip}>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xl text-gray-400 cursor-pointer"
                              onClick={(e) => handleTooltipClick(
                                e,
                                'status',
                                showStatusTooltip,
                                setShowStatusTooltip,
                                statusTooltipTimer,
                                setStatusTooltipTimer
                              )}
                              onMouseEnter={() => handleTooltipHover(true, 'status', setShowStatusTooltip)}
                              onMouseLeave={() => handleTooltipHover(false, 'status', setShowStatusTooltip)}
                            >
                              {t('end')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <p><strong>Active:</strong> Challenge in progress</p>
                              <p><strong>Pending:</strong> Challenge period ends, waiting for reward distribution</p>
                              <p><strong>End:</strong> Challenge reward distribution completed. Completely closed</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )
                }
              })()}
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
                  onMouseEnter={() => handleTooltipHover(true, 'onchain', setShowOnChainTooltip)}
                  onMouseLeave={() => handleTooltipHover(false, 'onchain', setShowOnChainTooltip)}
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
                <p className="text-sm">Portfolio value stored on-chain</p>
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
                          onMouseEnter={() => handleTooltipHover(true, 'live', setShowLiveTooltip)}
                          onMouseLeave={() => handleTooltipHover(false, 'live', setShowLiveTooltip)}
                        >
                          <span className="w-3 h-3 bg-current rounded-full animate-pulse"></span>
                          {t('live')}: ${realTimePortfolio.totalValue.toFixed(2)} ({isRealTimePositive ? '+' : ''}{realTimeGainLossPercentage.toFixed(2)}%)
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Real-time portfolio value not yet reflected on-chain</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })()}
            </div>
          )}
          {isLoadingUniswap && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              {t('loadingLivePrices')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 