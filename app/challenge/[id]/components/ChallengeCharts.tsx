'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { formatDateWithLocale } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { useChallengeSnapshots } from '../../hooks/useChallengeSnapshots'
import { useChallengeWeeklySnapshots } from '../../hooks/useChallengeWeeklySnapshots'
import { useChallenge } from '@/app/hooks/useChallenge'
import { useWallet } from '@/app/hooks/useWallet'
import { DollarSign, Plus, User, Loader2, Wallet } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ChallengeChartsProps {
  challengeId: string
  network: 'ethereum' | 'arbitrum' | null
  joinButton?: {
    isClient: boolean
    shouldShowGetRewards: boolean
    hasJoinedChallenge: boolean
    isChallengeEnded: boolean
    isJoining: boolean
    isLoadingChallenge: boolean
    challengeData: any
    isLoadingEntryFee: boolean
    isGettingRewards: boolean
    entryFee: string | null
    handleJoinChallenge: () => void
    handleNavigateToAccount: () => void
    handleGetRewards: () => void
    t: (key: any) => string
    // Wallet connection props
    isConnected: boolean
    walletSelectOpen: boolean
    setWalletSelectOpen: (open: boolean) => void
    isConnecting: boolean
    handleConnectWallet: () => Promise<void>
  }
}

export function ChallengeCharts({ challengeId, network, joinButton }: ChallengeChartsProps) {
  const { t, language } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly'>('daily')
  const { data, isLoading, error } = useChallengeSnapshots(challengeId, 30, network)
  const { data: weeklyData, isLoading: weeklyIsLoading, error: weeklyError } = useChallengeWeeklySnapshots(challengeId, 30, network)
  const { data: challengeData } = useChallenge(challengeId, network)
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second for accurate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const chartData = useMemo(() => {
    const sourceData = intervalType === 'weekly' ? weeklyData?.challengeWeeklySnapshots : data?.challengeSnapshots
    if (!sourceData) return []

    // Convert and sort data by timestamp
    const processedData = sourceData
      .map((snapshot) => {
        const date = new Date(Number(snapshot.timestamp) * 1000)
        
        return {
          id: snapshot.id,
          investorCount: Number(snapshot.investorCount),
          rewardAmountUSD: Number(snapshot.rewardAmountUSD), // Convert from wei to USD
          formattedDate: formatDateWithLocale(date, language, { 
            month: 'short', 
            day: 'numeric'
          }),
          fullDate: formatDateWithLocale(date, language, { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          dateLabel: date.toISOString().split('T')[0], // YYYY-MM-DD format
          timeLabel: (() => {
            // Extract month/day from dateLabel to avoid timezone issues
            const [year, month, day] = date.toISOString().split('T')[0].split('-')
            return `${parseInt(month)}/${parseInt(day)}`
          })(),
        }
      })
      .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel)) // Sort by date (ascending)

    return processedData
  }, [data, weeklyData, intervalType])

  // Calculate current values for headers (use the most recent snapshot or challenge data)
  const currentRewardAmount = useMemo(() => {
    // First try to get from the most recent snapshot
    if (chartData.length > 0) {
      const latestSnapshot = chartData[chartData.length - 1]?.rewardAmountUSD || 0
      if (latestSnapshot > 0) {
        return latestSnapshot
      }
    }
    
    // Fallback to challenge data if snapshot data is not available or is 0
    if (challengeData?.challenge) {
      return parseInt(challengeData.challenge.rewardAmountUSD)
    }
    
    return 0
  }, [chartData, challengeData])

  // Get challenge details for the info card
  const getChallengeDetails = () => {
    if (!challengeData?.challenge) {
      return {
        participants: 0,
        startTime: new Date(),
        endTime: new Date(),
        isActive: false,
        totalPrize: 0,
        challengePeriod: '',
      }
    }
    
    const challenge = challengeData.challenge
    const startTime = new Date(parseInt(challenge.startTime) * 1000)
    const endTime = new Date(parseInt(challenge.endTime) * 1000)
    
    // Get challenge period based on challenge type
    const getChallengeTypeLabel = (challengeType: number) => {
      switch(challengeType) {
        case 0:
          return t('oneWeek')
        case 1:
          return t('oneMonth')
        case 2:
          return t('threeMonths')
        case 3:
          return t('sixMonths')
        case 4:
          return t('oneYear')
        default:
          return `Type ${challengeType}`
      }
    }
    
    return {
      participants: parseInt(challenge.investorCounter),
      startTime,
      endTime,
      isActive: challenge.isActive,
      totalPrize: parseInt(challenge.rewardAmountUSD),
      challengePeriod: getChallengeTypeLabel(challenge.challengeType),
    }
  }

  const challengeDetails = getChallengeDetails()

  // Get challenge status based on isActive and endTime
  const getChallengeStatus = () => {
    if (!challengeData?.challenge) {
      return {
        status: 'end',
        color: 'text-red-400',
        text: t('end')
      }
    }

    const challenge = challengeData.challenge
    const endTime = new Date(parseInt(challenge.endTime) * 1000)
    const hasEnded = currentTime >= endTime

    if (challenge.isActive && !hasEnded) {
      return {
        status: 'active',
        color: 'text-green-400',
        text: t('active')
      }
    } else if (challenge.isActive && hasEnded) {
      return {
        status: 'pending',
        color: 'text-orange-400',
        text: t('pending')
      }
    } else {
      return {
        status: 'end',
        color: 'text-gray-400',
        text: t('end')
      }
    }
  }

  const challengeStatus = getChallengeStatus()

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const { startTime, endTime } = challengeDetails
    const totalDuration = endTime.getTime() - startTime.getTime()
    const elapsed = currentTime.getTime() - startTime.getTime()
    
    if (elapsed <= 0) return 0
    if (elapsed >= totalDuration) return 100
    
    return Math.round((elapsed / totalDuration) * 100)
  }

  const progressPercentage = getProgressPercentage()

  // Calculate remaining time in a human-readable format
  const getRemainingTime = () => {
    const { endTime } = challengeDetails
    const remainingMs = endTime.getTime() - currentTime.getTime()
    
    if (remainingMs <= 0) return t('ended')
    
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
    
    if (days > 30) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      return `${months} ${t('months')} ${remainingDays} ${t('days')}`
    }
    
    if (days > 0) {
      return `${days} ${t('days')} ${hours} ${t('hours')}`
    }
    
    if (hours > 0) {
      return `${hours} ${t('hours')} ${minutes} ${t('minutes')}`
    }
    
    if (minutes > 0) {
      return `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}`
    }
    
    return `${seconds} ${t('seconds')}`
  }

  const remainingTime = getRemainingTime()

  // Get current date for header
  const currentDate = formatDateWithLocale(new Date(), language, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value
      
      return (
        <div className="bg-gray-800/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-gray-100 text-sm font-medium">
            {t('totalPrize')}: ${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading || weeklyIsLoading) {
    return (
      <div className="mb-6">
        <Card className="bg-transparent border-0 -mt-12">
          <CardHeader className="pb-2 px-1 sm:px-6 md:-ml-2">
            <div className="h-8 bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent className="px-1 sm:px-6 md:-ml-2">
            <div className="h-80 bg-gray-700 rounded animate-pulse mb-4"></div>
            {/* Daily/Weekly buttons skeleton */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50">
                <div className="w-16 h-8 bg-gray-700 rounded-full animate-pulse mr-1"></div>
                <div className="w-16 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* Separator */}
            <div className="border-t border-gray-600/50 mx-2 sm:mx-0 pt-2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if ((error && intervalType === 'daily') || (weeklyError && intervalType === 'weekly') || (!data?.challengeSnapshots && intervalType === 'daily') || (!weeklyData?.challengeWeeklySnapshots && intervalType === 'weekly') || chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-muted border-gray-700/50 lg:col-span-2">
          <CardHeader>
            <div className="mb-2">
              <h3 className="text-3xl text-gray-100">{t('totalPrize')}</h3>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-4xl text-gray-100">$0</CardTitle>
              {/* Desktop buttons - Show only on desktop */}
              {joinButton && (
                <div className="hidden md:flex items-center space-x-2">
                  {joinButton.isClient && joinButton.shouldShowGetRewards && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleGetRewards}
                      disabled={joinButton.isGettingRewards}
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {joinButton.isGettingRewards ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Get Rewards
                        </>
                      )}
                    </Button>
                  )}
                  
                  {!joinButton.isConnected ? (
                    <Dialog open={joinButton.walletSelectOpen} onOpenChange={joinButton.setWalletSelectOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          {joinButton.t('connectWallet')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{joinButton.t('connectWallet')}</DialogTitle>
                          <DialogDescription>
                            {joinButton.t('chooseWalletToConnect')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Button
                            variant="outline"
                            onClick={() => joinButton.handleConnectWallet()}
                            disabled={joinButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {joinButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/metamask.png" 
                                alt="MetaMask"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            MetaMask
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => joinButton.handleConnectWallet()}
                            disabled={joinButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {joinButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/phantom.png" 
                                alt="Phantom"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            Phantom
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : joinButton.hasJoinedChallenge ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleNavigateToAccount}
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {joinButton.t('myAccount')}
                    </Button>
                  ) : !joinButton.isChallengeEnded && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleJoinChallenge} 
                      disabled={joinButton.isJoining || joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge || joinButton.isLoadingEntryFee}
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {joinButton.isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {joinButton.t('joining')}
                        </>
                      ) : joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : joinButton.isLoadingEntryFee ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {joinButton.t('loading')}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1 h-4 w-4" />
                          {joinButton.t('join')} (USDC $10)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">{currentDate}</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('noDataAvailable')}</p>
            </div>
          </CardContent>
          
          {/* Interval selector - Below chart like investor page */}
          <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2">
            <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
              <button
                onClick={() => setIntervalType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                  intervalType === 'daily' 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                {t('daily')}
              </button>
              <button
                onClick={() => setIntervalType('weekly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                  intervalType === 'weekly' 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                {t('weekly')}
              </button>
            </div>
          </div>
          
          {/* Separator Bar - Below daily/weekly buttons, chart width */}
          <div className="pr-6 mb-4 pt-2">
            <div className="border-t border-gray-600/50"></div>
          </div>
        </Card>
        
        <Card className="bg-muted border-gray-700/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100">Challenge Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('loadingChallengeData')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Float Buttons - Only visible on mobile (Error State) */}
        {joinButton && !isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4">
              {(() => {
                const buttons = [];
                
                // Get Rewards Button
                if (joinButton.isClient && joinButton.shouldShowGetRewards) {
                  buttons.push(
                    <Button 
                      key="get-rewards"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleGetRewards}
                      disabled={joinButton.isGettingRewards}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {joinButton.isGettingRewards ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          Get Rewards
                        </>
                      )}
                    </Button>
                  );
                }
                
                // My Account Button
                if (joinButton.hasJoinedChallenge) {
                  buttons.push(
                    <Button 
                      key="my-account"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleNavigateToAccount}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      <User className="mr-2 h-5 w-5" />
                      {joinButton.t('myAccount')}
                    </Button>
                  );
                }
                
                // Join Button
                if (!joinButton.hasJoinedChallenge && !joinButton.isChallengeEnded) {
                  buttons.push(
                    <Button 
                      key="join"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleJoinChallenge} 
                      disabled={joinButton.isJoining || joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge || joinButton.isLoadingEntryFee}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {joinButton.isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {joinButton.t('joining')}
                        </>
                      ) : joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Loading...
                        </>
                      ) : joinButton.isLoadingEntryFee ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {joinButton.t('loading')}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          {joinButton.t('join')} (USDC $10)
                        </>
                      )}
                    </Button>
                  );
                }
                
                // Return the buttons with appropriate layout
                if (buttons.length === 1) {
                  return buttons[0];
                } else if (buttons.length === 2) {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {buttons.map(button => 
                        React.cloneElement(button, {
                          className: button.props.className.replace('w-full ', '')
                        })
                      )}
                    </div>
                  );
                } else {
                  return null;
                }
              })()}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Total Rewards Chart */}
      <Card className="bg-transparent border-0 -mt-12">
        <CardHeader className="pb-2 px-1 sm:px-6 md:-ml-2">
          {/* Mobile layout */}
          <div className="block md:hidden">
            {/* First row: Challenge title only */}
            <div className="mb-4">
              <h3 className="text-3xl text-gray-100">{t('challenge')} {challengeId}</h3>
            </div>
            
            {/* Second row: $3 amount + Hidden buttons for mobile (will be shown in float) */}
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <CardTitle className="text-4xl font-bold text-gray-100">
                ${currentRewardAmount >= 1000000 ? `${(currentRewardAmount / 1000000).toFixed(1)}M` : currentRewardAmount >= 1000 ? `${(currentRewardAmount / 1000).toFixed(1)}K` : currentRewardAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </CardTitle>
              
              {/* Mobile buttons are now hidden - they will be shown in float */}
            </div>
          </div>
          
          {/* Desktop layout */}
          <div className="hidden md:block md:mr-6">
            <div className="mb-4">
              <h3 className="text-3xl text-gray-100">{t('challenge')} {challengeId}</h3>
            </div>
              
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <CardTitle className="text-4xl font-bold text-gray-100">
              ${currentRewardAmount >= 1000000 ? `${(currentRewardAmount / 1000000).toFixed(1)}M` : currentRewardAmount >= 1000 ? `${(currentRewardAmount / 1000).toFixed(1)}K` : currentRewardAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-0 md:mr-16 -ml-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 10, left: 5, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                  setActiveIndexRewards(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setActiveIndexRewards(null)}
            >
              <defs>
                <linearGradient id="rewardGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="#9CA3AF"
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                orientation="left"
                stroke="#9CA3AF"
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={35}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}K`
                  } else {
                    return `$${value.toFixed(0)}`
                  }
                }}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#f97316', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="rewardAmountUSD" 
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#rewardGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
        
        {/* Interval selector - Below chart like investor page */}
        <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-20">
          <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setIntervalType('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                intervalType === 'daily' 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {t('daily')}
            </button>
            <button
              onClick={() => setIntervalType('weekly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                intervalType === 'weekly' 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {t('weekly')}
            </button>
          </div>
        </div>
        
        {/* Separator Bar - Below daily/weekly buttons, chart width */}
        <div className="pr-6 md:mr-12 -mr-4 mb-0 pt-2">
          <div className="border-t border-gray-600/50"></div>
        </div>
      </Card>

        {/* Mobile Float Buttons - Only visible on mobile */}
        {joinButton && !isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4">
              {(() => {
                const buttons = [];
                
                // Connect Button (when wallet is not connected)
                if (!joinButton.isConnected) {
                  buttons.push(
                    <Dialog key="connect-dialog" open={joinButton.walletSelectOpen} onOpenChange={joinButton.setWalletSelectOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          {joinButton.t('connectWallet')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{joinButton.t('connectWallet')}</DialogTitle>
                          <DialogDescription>
                            {joinButton.t('chooseWalletToConnect')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Button
                            variant="outline"
                            onClick={() => joinButton.handleConnectWallet()}
                            disabled={joinButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {joinButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/metamask.png" 
                                alt="MetaMask"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            MetaMask
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => joinButton.handleConnectWallet()}
                            disabled={joinButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {joinButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/phantom.png" 
                                alt="Phantom"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            Phantom
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                  
                  // Return early if wallet is not connected
                  return buttons[0];
                }
                
                // Get Rewards Button
                if (joinButton.isClient && joinButton.shouldShowGetRewards) {
                  buttons.push(
                    <Button 
                      key="get-rewards"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleGetRewards}
                      disabled={joinButton.isGettingRewards}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {joinButton.isGettingRewards ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          Get Rewards
                        </>
                      )}
                    </Button>
                  );
                }
                
                // My Account Button
                if (joinButton.hasJoinedChallenge) {
                  buttons.push(
                    <Button 
                      key="my-account"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleNavigateToAccount}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      <User className="mr-2 h-5 w-5" />
                      {joinButton.t('myAccount')}
                    </Button>
                  );
                }
                
                // Join Button
                if (!joinButton.hasJoinedChallenge && !joinButton.isChallengeEnded) {
                  buttons.push(
                    <Button 
                      key="join"
                      variant="outline" 
                      size="lg" 
                      onClick={joinButton.handleJoinChallenge} 
                      disabled={joinButton.isJoining || joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge || joinButton.isLoadingEntryFee}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {joinButton.isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {joinButton.t('joining')}
                        </>
                      ) : joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Loading...
                        </>
                      ) : joinButton.isLoadingEntryFee ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {joinButton.t('loading')}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          {joinButton.t('join')} (USDC $10)
                        </>
                      )}
                    </Button>
                  );
                }
                
                // Return the buttons with appropriate layout
                if (buttons.length === 1) {
                  return buttons[0];
                } else if (buttons.length === 2) {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {buttons.map(button => 
                        React.cloneElement(button, {
                          className: button.props.className.replace('w-full ', '')
                        })
                      )}
                    </div>
                  );
                } else {
                  return null;
                }
              })()}
            </div>
          </div>
        )}
    </div>
  )
} 