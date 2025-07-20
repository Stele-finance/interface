import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/language-context"
import { ChallengeDetails, TimeRemaining } from "../types"
import { getTimeRemaining } from "../utils"

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
  const { t } = useLanguage()
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null)

  // Handle click outside to close mobile tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileTooltip) {
        setShowMobileTooltip(false);
        // Clear timer when closing tooltip
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          setTooltipTimer(null);
        }
      }
    };

    if (showMobileTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMobileTooltip, tooltipTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  return (
    <Card className="bg-muted border-0 rounded-2xl">
      <CardContent className="p-8 space-y-8">
        {/* Row 1: Challenge ID and Seed Money */}
        <div className="grid grid-cols-2 gap-6">
          {/* Challenge ID */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('challenge')}</span>
            <div className="text-3xl text-white">
              {challengeId}
            </div>
          </div>

          {/* Seed Money */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('seedMoney')}</span>
            <div className="text-3xl text-white">
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
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-400">{t('progress')}</span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Clear existing timer
                      if (tooltipTimer) {
                        clearTimeout(tooltipTimer);
                        setTooltipTimer(null);
                      }
                      
                      if (!showMobileTooltip) {
                        // Show tooltip
                        setShowMobileTooltip(true);
                        
                        // Auto-close after 4 seconds on mobile
                        if (!window.matchMedia('(hover: hover)').matches) {
                          const timer = setTimeout(() => {
                            setShowMobileTooltip(false);
                            setTooltipTimer(null);
                          }, 4000);
                          setTooltipTimer(timer);
                        }
                      } else {
                        // Hide tooltip
                        setShowMobileTooltip(false);
                      }
                    }}
                    onMouseEnter={() => {
                      // Only trigger on desktop (devices with hover capability)
                      if (window.matchMedia('(hover: hover)').matches) {
                        setShowMobileTooltip(true);
                      }
                    }}
                    onMouseLeave={() => {
                      // Only trigger on desktop (devices with hover capability)
                      if (window.matchMedia('(hover: hover)').matches) {
                        setShowMobileTooltip(false);
                      }
                    }}
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
          
          {/* Time Info */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>{t('start')}: {challengeDetails?.startTime.toLocaleDateString() || 'N/A'}</span>
            <span>End: {challengeDetails?.endTime.toLocaleDateString() || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 