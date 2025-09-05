import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/lib/language-context"
import { formatDateWithLocale } from "@/lib/utils"
import { ChallengeDetails, TimeRemaining } from "../types"
import { getTimeRemaining } from "../utils"
import { Trophy } from "lucide-react"
import Image from "next/image"

interface ChallengeInfoProps {
  challengeId: string
  challengeData: any
  challengeDetails: ChallengeDetails | null
  timeRemaining: TimeRemaining
  isClient: boolean
  currentTime: Date
  network: string
}

export function ChallengeInfo({ 
  challengeId, 
  challengeData, 
  challengeDetails, 
  timeRemaining, 
  isClient, 
  currentTime,
  network
}: ChallengeInfoProps) {
  const { t, language } = useLanguage()
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
    <Card className="bg-muted/30 border border-gray-700/50 rounded-2xl">
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
            <span className="text-sm text-gray-400">Challenge ID</span>
            <span className="text-sm text-white font-medium">#{challengeId}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
            <span className="text-sm text-gray-400">{t('seedMoney')}</span>
            <span className="text-sm text-white font-medium">
              {(() => {
                if (challengeData?.challenge?.seedMoney) {
                  const seedMoneyValue = parseInt(challengeData.challenge.seedMoney);
                  return seedMoneyValue > 0 ? `$${seedMoneyValue.toLocaleString()}` : '$0';
                }
                return '$0';
              })()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-400">{t('investors')}</span>
            <span className="text-sm text-white font-medium">
              {challengeData?.challenge ? parseInt(challengeData.challenge.investorCounter).toLocaleString() : '0'}
            </span>
          </div>
          
        </div>
      </div>
    </Card>
  )
} 