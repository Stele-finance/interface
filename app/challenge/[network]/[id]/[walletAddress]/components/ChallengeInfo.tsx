import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/language-context"
import { formatDateWithLocale } from "@/lib/utils"
import { ChallengeDetails, TimeRemaining } from "../types"
import { getTimeRemaining } from "../utils"
import { Trophy } from "lucide-react"
import Image from "next/image"
import { useWallet } from "@/app/hooks/useWallet"

interface ChallengeInfoProps {
  challengeId: string
  challengeData: any
  challengeDetails: ChallengeDetails | null
  timeRemaining: TimeRemaining
  isClient: boolean
  currentTime: Date
}

export function ChallengeInfo({ 
  challengeId, 
  challengeData, 
  challengeDetails, 
  timeRemaining, 
  isClient, 
  currentTime 
}: ChallengeInfoProps) {
  const { t, language } = useLanguage()
  const { network } = useWallet()
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [showSeedMoneyTooltip, setShowSeedMoneyTooltip] = useState(false)
  const [seedMoneyTooltipTimer, setSeedMoneyTooltipTimer] = useState<NodeJS.Timeout | null>(null)

  // Handle interactions to close mobile tooltips
  useEffect(() => {
    const closeAllTooltips = () => {
      if (showMobileTooltip || showSeedMoneyTooltip) {
        setShowMobileTooltip(false);
        setShowSeedMoneyTooltip(false);
        // Clear timer when closing tooltip
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          setTooltipTimer(null);
        }
        if (seedMoneyTooltipTimer) {
          clearTimeout(seedMoneyTooltipTimer);
          setSeedMoneyTooltipTimer(null);
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

    if (showMobileTooltip || showSeedMoneyTooltip) {
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
  }, [showMobileTooltip, showSeedMoneyTooltip, tooltipTimer, seedMoneyTooltipTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
      if (seedMoneyTooltipTimer) {
        clearTimeout(seedMoneyTooltipTimer);
      }
    };
  }, [tooltipTimer, seedMoneyTooltipTimer]);

  // Helper function to handle tooltip click for mobile and desktop
  const handleTooltipClick = (
    e: React.MouseEvent,
    tooltipType: 'progress' | 'seedmoney',
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
      
      // Auto-close after 2 seconds only for mobile
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
        {/* Row 1: Challenge ID and Seed Money */}
        <div className="grid grid-cols-2 gap-6">
          {/* Challenge ID */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('challenge')}</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Trophy className="w-6 h-6 text-yellow-400" />
                {/* Show network icon only when connected to Arbitrum */}
                {network === 'arbitrum' && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                    <Image 
                      src="/networks/small/arbitrum.png" 
                      alt="Arbitrum"
                      width={12}
                      height={12}
                      className="rounded-full"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                )}
              </div>
              <div className="text-3xl text-white">
                {challengeId}
              </div>
            </div>
          </div>

          {/* Seed Money */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('seedMoney')}</span>
            <TooltipProvider>
              <Tooltip open={showSeedMoneyTooltip}>
                <TooltipTrigger asChild>
                                    <div 
                    className="text-3xl text-white cursor-pointer"
                    onClick={(e) => handleTooltipClick(
                      e, 
                      'seedmoney', 
                      showSeedMoneyTooltip, 
                      setShowSeedMoneyTooltip, 
                      seedMoneyTooltipTimer, 
                      setSeedMoneyTooltipTimer
                    )}
                    onMouseLeave={() => handleMouseLeave(setShowSeedMoneyTooltip, seedMoneyTooltipTimer, setSeedMoneyTooltipTimer)}
                  >
                    {(() => {
                      // If we have challenge data and seedMoney is available
                      if (challengeData?.challenge?.seedMoney) {
                        const seedMoneyValue = parseInt(challengeData.challenge.seedMoney);
                        return seedMoneyValue > 0 ? `$${seedMoneyValue}` : '$0';
                      }
                      // Default fallback
                      return '$0';
                    })()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{t('tooltipSeedMoney')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Challenge Type & Progress */}
        <div className="space-y-3">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⏳</span>
                  <span className="text-lg text-gray-400">
                    {(() => {
                      const challengeType = challengeData?.challenge?.challengeType;
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
                  </span>
                </div>
              </div>
              <span className="text-base font-medium text-gray-300">
                {(() => {
                  if (!challengeDetails || !isClient) return '0%';
                  
                  const startTime = challengeDetails.startTime.getTime();
                  const endTime = challengeDetails.endTime.getTime();
                  const now = currentTime.getTime();
                  
                  if (now < startTime) return '0%';
                  if (now >= endTime) return '100%';
                  
                  const totalDuration = endTime - startTime;
                  const elapsed = now - startTime;
                  const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                  
                  return `${progress.toFixed(0)}%`;
                })()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip open={showMobileTooltip}>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-full bg-gray-700 rounded-full h-3 cursor-pointer"
                      onClick={(e) => handleTooltipClick(
                        e, 
                        'progress', 
                        showMobileTooltip, 
                        setShowMobileTooltip, 
                        tooltipTimer, 
                        setTooltipTimer
                      )}
                      onMouseLeave={() => handleMouseLeave(setShowMobileTooltip, tooltipTimer, setTooltipTimer)}
                    >
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ 
                          width: `${(() => {
                            if (!challengeDetails || !isClient) return 0;
                            
                            const startTime = challengeDetails.startTime.getTime();
                            const endTime = challengeDetails.endTime.getTime();
                            const now = currentTime.getTime();
                            
                            if (now < startTime) return 0;
                            if (now >= endTime) return 100;
                            
                            const totalDuration = endTime - startTime;
                            const elapsed = now - startTime;
                            const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                            
                            return progress;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm font-medium">{timeRemaining.text}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Time Info */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>{challengeDetails?.startTime ? challengeDetails.startTime.toLocaleDateString() : 'N/A'}</span>
            <span>{challengeDetails?.endTime ? challengeDetails.endTime.toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 