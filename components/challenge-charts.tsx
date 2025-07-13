'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { useChallengeSnapshots } from '@/app/hooks/useChallengeSnapshots'
import { useChallengeWeeklySnapshots } from '@/app/hooks/useChallengeWeeklySnapshots'
import { useChallenge } from '@/app/hooks/useChallenge'
import { useWallet } from '@/app/hooks/useWallet'
import { Users, DollarSign, Clock, Trophy, Calendar, Plus, UserPlus, User, Loader2 } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'

interface ChartDataPoint {
  id: string
  investorCount: number
  rewardAmountUSD: number
  formattedDate: string
  fullDate: string
  timeLabel: string
  dateLabel: string
}

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
    isLoadingBalance: boolean
    isInsufficientBalance: boolean
    isGettingRewards: boolean
    handleJoinChallenge: () => void
    handleNavigateToAccount: () => void
    handleGetRewards: () => void
    t: (key: any) => string
  }
}

export function ChallengeCharts({ challengeId, network, joinButton }: ChallengeChartsProps) {
  const { t } = useLanguage()
  const { network: walletNetwork } = useWallet()
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
          formattedDate: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          }),
          fullDate: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          timeLabel: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          dateLabel: date.toISOString().split('T')[0] // YYYY-MM-DD format
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
        status: 'finished',
        color: 'text-red-400',
        text: t('finished')
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
        status: 'pending_reward',
        color: 'text-orange-400',
        text: 'Pending reward'
      }
    } else {
      return {
        status: 'finished',
        color: 'text-red-400',
        text: t('finished')
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
  const currentDate = new Date().toLocaleDateString('en-US', { 
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

  const CustomCursor = ({ x, y, width, height }: any) => {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(255, 255, 255, 0.1)"
        rx={8}
        ry={8}
      />
    )
  }

  if (isLoading || weeklyIsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gray-900/50 border-gray-700/50 lg:col-span-2">
          <CardHeader>
            <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse mt-2 w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700/50 lg:col-span-1">
          <CardHeader>
            <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse mt-2 w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if ((error && intervalType === 'daily') || (weeklyError && intervalType === 'weekly') || (!data?.challengeSnapshots && intervalType === 'daily') || (!weeklyData?.challengeWeeklySnapshots && intervalType === 'weekly') || chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gray-900/50 border-gray-700/50 lg:col-span-2">
          <CardHeader>
                      <div className="flex items-center justify-between mb-2">
            <h3 className="text-3xl text-gray-100">{t('totalPrize')}</h3>
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setIntervalType('daily')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'daily' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setIntervalType('weekly')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'weekly' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl text-gray-100">$0</CardTitle>
            <p className="text-sm text-gray-400">{currentDate}</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('noDataAvailable')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100">Challenge Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">Loading challenge data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Rewards Chart - Takes 2 columns */}
      <Card className="bg-transparent border-0 lg:col-span-2 -mt-12">
        <CardHeader className="pb-2 px-1 sm:px-6">
          {/* Mobile layout */}
          <div className="block md:hidden">
            {/* First row: Challenge title + Join Button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl text-gray-100">Challenge {challengeId}</h3>
              
              {/* Join Button for Mobile */}
              {joinButton && (
                <div className="flex items-center space-x-2">
                  {/* Get Rewards Button - Show when challenge is ended AND current wallet is in top 5 */}
                  {joinButton.isClient && joinButton.shouldShowGetRewards && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleGetRewards}
                      disabled={joinButton.isGettingRewards}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-yellow-500 hover:border-yellow-400 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                  
                  {joinButton.hasJoinedChallenge ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleNavigateToAccount}
                      className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-gray-500 hover:border-gray-400 font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {joinButton.t('myAccount')}
                    </Button>
                  ) : !joinButton.isChallengeEnded && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={joinButton.handleJoinChallenge} 
                      disabled={joinButton.isJoining || joinButton.isLoadingChallenge || !joinButton.challengeData?.challenge || joinButton.isLoadingEntryFee || joinButton.isLoadingBalance || joinButton.isInsufficientBalance}
                      className={`font-semibold px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                        joinButton.isInsufficientBalance
                          ? "bg-gray-600 hover:bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed" 
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                      }`}
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
                      ) : joinButton.isLoadingEntryFee || joinButton.isLoadingBalance ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {joinButton.t('loading')}
                        </>
                      ) : joinButton.isInsufficientBalance ? (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Insufficient USDC
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1 h-4 w-4" />
                          {joinButton.t('join')}
                          <UserPlus className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Second row: $3 amount + Daily/Weekly badges */}
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <CardTitle className="text-4xl font-bold text-gray-100">
                ${currentRewardAmount >= 1000000 ? `${(currentRewardAmount / 1000000).toFixed(1)}M` : currentRewardAmount >= 1000 ? `${(currentRewardAmount / 1000).toFixed(1)}K` : currentRewardAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <button
                    onClick={() => setIntervalType('daily')}
                    className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                      intervalType === 'daily' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                    }`}
                  >
                    {t('daily')}
                  </button>
                  <button
                    onClick={() => setIntervalType('weekly')}
                    className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                      intervalType === 'weekly' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                    }`}
                  >
                    {t('weekly')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop layout */}
          <div className="hidden md:block">
          <div className="mb-4">
            <h3 className="text-3xl text-gray-100">Challenge {challengeId}</h3>
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-2">
            <CardTitle className="text-4xl font-bold text-gray-100">
            ${currentRewardAmount >= 1000000 ? `${(currentRewardAmount / 1000000).toFixed(1)}M` : currentRewardAmount >= 1000 ? `${(currentRewardAmount / 1000).toFixed(1)}K` : currentRewardAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setIntervalType('daily')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'daily' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setIntervalType('weekly')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'weekly' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
            </div>
          </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
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
                width={25}
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
      </Card>

      {/* Challenge Info Card */}
      <Card className="bg-gray-900 border-0 lg:col-span-1 rounded-2xl h-fit lg:mt-8">
        <CardContent className="p-8 space-y-10">
          {/* Row 1: Type and Status */}
          <div className="grid grid-cols-2 gap-6">
            {/* Type */}
            <div className="space-y-2">
              <span className="text-base text-gray-400">{t('type')}</span>
              <div className="text-3xl text-white">{challengeDetails.challengePeriod}</div>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <span className="text-base text-gray-400">{t('status')}</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-transparent flex items-center justify-center">
                  {walletNetwork === 'ethereum' ? (
                    <Image 
                      src="/networks/small/ethereum.png" 
                      alt="Ethereum Mainnet"
                      width={16}
                      height={16}
                      className="rounded-full"
                      style={{ width: '16px', height: '16px' }}
                    />
                  ) : walletNetwork === 'arbitrum' ? (
                    <Image 
                      src="/networks/small/arbitrum.png" 
                      alt="Arbitrum One"
                      width={16}
                      height={16}
                      className="rounded-full"
                      style={{ width: '16px', height: '16px' }}
                    />
                  ) : (
                    <Image 
                      src="/networks/small/ethereum.png" 
                      alt="Ethereum Mainnet"
                      width={16}
                      height={16}
                      className="rounded-full"
                      style={{ width: '16px', height: '16px' }}
                    />
                  )}
                </div>
                <span className={`text-3xl font-medium ${challengeStatus.color}`}>
                  {challengeStatus.text}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Total Prize and Users */}
          <div className="grid grid-cols-2 gap-6">
            {/* Total Prize */}
            <div className="space-y-2">
              <span className="text-base text-gray-400">{t('totalPrize')}</span>
              <div className="text-4xl text-yellow-400">
                ${challengeDetails.totalPrize >= 1000000 
                  ? `${(challengeDetails.totalPrize / 1000000).toFixed(1)}M` 
                  : challengeDetails.totalPrize >= 1000 
                  ? `${(challengeDetails.totalPrize / 1000).toFixed(1)}K` 
                  : challengeDetails.totalPrize.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                }
              </div>
            </div>

            {/* Users */}
            <div className="space-y-2">
              <span className="text-base text-gray-400">{t('users')}</span>
              <div className="text-4xl text-white">{challengeDetails.participants.toLocaleString()}</div>
            </div>
          </div>

          {/* Row 3: Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-gray-400">{t('progress')}</span>
              <span className="text-base font-medium text-gray-300">{progressPercentage}%</span>
            </div>
            
            {/* Progress Bar */}
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium">{remainingTime}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
            
            {/* Time Info */}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Start: {challengeDetails.startTime.toLocaleDateString()}</span>
              <span>End: {challengeDetails.endTime.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 