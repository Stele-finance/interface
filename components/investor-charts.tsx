'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts'
import { useInvestorSnapshots } from '@/app/hooks/useInvestorSnapshots'
import { useInvestorWeeklySnapshots } from '@/app/hooks/useInvestorWeeklySnapshots'
import { useChallenge } from '@/app/hooks/useChallenge'
import { useRanking } from '@/app/hooks/useRanking'
import { DollarSign, TrendingUp, TrendingDown, User, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { USDC_DECIMALS } from '@/lib/constants'
import { useLanguage } from '@/lib/language-context'

interface ChartDataPoint {
  id: string
  currentUSD: number
  seedMoneyUSD: number
  profitRatio: number
  formattedDate: string
  fullDate: string
  timeLabel: string
  dateLabel: string
  isRealTime?: boolean
}

interface RealTimePortfolio {
  totalValue: number
  tokensWithPrices: number
  totalTokens: number
  timestamp: number
}

interface InvestorChartsProps {
  challengeId: string
  investor: string
  network: 'ethereum' | 'arbitrum' | null
  investorData?: any // Add investor data prop for calculations
  realTimePortfolio?: RealTimePortfolio | null
}

export function InvestorCharts({ challengeId, investor, network, investorData, realTimePortfolio }: InvestorChartsProps) {
  const { t } = useLanguage()
  const { data, isLoading, error } = useInvestorSnapshots(challengeId, investor, 30, network)
  const { data: weeklyData, isLoading: isLoadingWeekly, error: weeklyError } = useInvestorWeeklySnapshots(challengeId, investor, 30, network)
  const { data: challengeData } = useChallenge(challengeId, network)
  const { data: rankingResponse } = useRanking(challengeId, network)
  const [activeIndexPortfolio, setActiveIndexPortfolio] = useState<number | null>(null)
  const [interval, setInterval] = useState<'daily' | 'weekly'>('daily')

  const chartData = useMemo(() => {
    // Select data source based on interval
    const selectedData = interval === 'weekly' 
      ? weeklyData?.investorWeeklySnapshots 
      : data?.investorSnapshots
    
    if (!selectedData) return []

    // Convert and sort data by timestamp
    const processedData = selectedData
      .map((snapshot, index) => {
        const date = new Date(Number(snapshot.timestamp) * 1000)
        
        return {
          id: `${snapshot.id}-${index}`,
          // USD values are already in USD format from subgraph
          currentUSD: parseFloat(snapshot.currentUSD) || 0,
          seedMoneyUSD: Number(snapshot.seedMoneyUSD),
          profitRatio: Number(snapshot.profitRatio),
          formattedDate: interval === 'weekly' 
            ? date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })
            : date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              }),
          fullDate: interval === 'weekly'
            ? date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })
            : date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
          timeLabel: interval === 'weekly'
            ? date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })
            : date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
          dateLabel: date.toISOString().split('T')[0], // YYYY-MM-DD format
          isRealTime: false
        }
      })
      .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel)) // Sort by date (ascending)

    // Add real-time data point if available (only for daily interval)
    if (interval === 'daily' && realTimePortfolio && realTimePortfolio.totalValue > 0) {
      const currentDate = new Date(realTimePortfolio.timestamp)
      const seedMoney = investorData?.investor ? (parseFloat(investorData.investor.seedMoneyUSD) || 0) : 0
      
      const realTimeDataPoint = {
        id: `realtime-${realTimePortfolio.timestamp}-${Date.now()}`,
        currentUSD: realTimePortfolio.totalValue,
        seedMoneyUSD: seedMoney,
        profitRatio: seedMoney > 0 ? ((realTimePortfolio.totalValue - seedMoney) / seedMoney) : 0,
        formattedDate: currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: `${currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })} (Live)`,
        timeLabel: currentDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        dateLabel: currentDate.toISOString().split('T')[0],
        isRealTime: true
      }
      
      // Add real-time point to the end of the chart
      processedData.push(realTimeDataPoint)
    }

    return processedData
  }, [data, weeklyData, interval, realTimePortfolio, investorData])

  // Calculate current values for headers (prefer real-time data if available)
  const currentPortfolioValue = useMemo(() => {
    if (realTimePortfolio && realTimePortfolio.totalValue > 0) {
      return realTimePortfolio.totalValue
    }
    if (!chartData.length) return 0
    return chartData[chartData.length - 1]?.currentUSD || 0
  }, [chartData, realTimePortfolio])

  // Calculate investor metrics (using real-time data when available)
  const getInvestorMetrics = () => {
    if (!investorData?.investor) {
      return {
        portfolioValue: 0,
        gainLoss: 0,
        gainLossPercentage: 0,
        isPositive: false,
        ranking: 0,
        totalRewards: '$0.00'
      }
    }

    const investor = investorData.investor
    const formattedSeedMoney = parseFloat(investor.seedMoneyUSD) || 0
    
    // Use real-time portfolio value if available, otherwise use subgraph data
    const currentValue = realTimePortfolio && realTimePortfolio.totalValue > 0 
      ? realTimePortfolio.totalValue 
      : (parseFloat(investor.currentUSD) || 0)
    
    const gainLoss = currentValue - formattedSeedMoney
    const gainLossPercentage = formattedSeedMoney > 0 ? (gainLoss / formattedSeedMoney) * 100 : 0
    const isPositive = gainLoss >= 0

    // Get challenge details for total rewards
    const totalRewards = challengeData?.challenge 
      ? `$${(parseInt(challengeData.challenge.rewardAmountUSD) / 1e18).toFixed(2)}`
      : '$0.00'

    // Get participant count for ranking estimate
    const participants = challengeData?.challenge 
      ? parseInt(challengeData.challenge.investorCounter)
      : 0

    return {
      portfolioValue: currentValue,
      gainLoss,
      gainLossPercentage,
      isPositive,
      ranking: participants, // This is an estimate - you might want to get actual ranking
      totalRewards
    }
  }

  const metrics = getInvestorMetrics()

    // Process real ranking data from the same source as Ranking tab
  const rankingData = useMemo(() => {
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5', '#10B981']
    const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

    // If no data, return empty array
    if (!rankingResponse?.topUsers || !rankingResponse?.scores) {
      return []
    }

    // Process real data, same logic as Ranking tab
     const result = []
    for (let i = 0; i < Math.min(5, rankingResponse.topUsers.length); i++) {
      const user = rankingResponse.topUsers[i]
       const score = rankingResponse.scores[i]
      const profitRatio = rankingResponse.profitRatios[i]
      
      // Format address - same logic as Ranking tab
      const formatAddress = (address: string) => {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
          return '';
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };
      
      // Parse score value - same logic as Ranking tab
       let scoreValue = 0
       if (score) {
         try {
             scoreValue = parseFloat(score)
         } catch (error) {
           console.warn('Error parsing score:', score, error)
           scoreValue = 0
         }
       }
       
       result.push({
         rank: i + 1,
        user: formatAddress(user),
         value: scoreValue,
        profitRatio: profitRatio ? parseFloat(profitRatio) : 0,
         color: colors[i],
         emoji: emojis[i],
         bgGradient: `linear-gradient(45deg, ${colors[i]}, ${colors[i]})`
       })
     }

    return result
  }, [rankingResponse])

  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return undefined // Let chart auto-scale if no data
    
    // Get current user's maximum value
    const userMaxValue = Math.max(...chartData.map(d => d.currentUSD))
    
    // Get ranking 1st place value
    const firstPlaceValue = rankingData[0]?.value || 0
    
    // Set maximum to the higher value between user max and 1st place
    const maxValue = Math.max(userMaxValue, firstPlaceValue)
    
    // Add 10% padding to the top, but ensure minimum of 100
    const paddedMaxValue = Math.max(maxValue * 1.1, 100)
    
    return [0, paddedMaxValue] as [number, number]
  }, [chartData, rankingData])

  // Get current date for header
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const CustomTooltipPortfolio = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value
      const dataPoint = payload[0]?.payload
      const isRealTime = dataPoint?.isRealTime
      const isRegistered = investorData?.investor?.isRegistered === true
      
      // Check if this is the last data point (most recent)
      const isLastDataPoint = chartData.length > 0 && dataPoint?.id === chartData[chartData.length - 1]?.id
      
      // Show ranking info if:
      // 1. Real-time data point, OR
      // 2. Registered user hovering over the last data point
      const shouldShowRanking = isRealTime || (isRegistered && isLastDataPoint)
      
      return (
        <div className="bg-gray-800/95 border border-gray-600 rounded-lg px-4 py-3 shadow-xl backdrop-blur-sm min-w-[280px]">
          <p className="text-gray-100 text-sm font-medium mb-2">
            {t('portfolioValue')}: ${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {isRealTime && (
            <div className="flex items-center gap-1 mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-green-400 text-xs">{t('liveUniswapV3')}</p>
            </div>
          )}
          
          {/* Show ranking information for real-time data or registered users on last data point */}
          {shouldShowRanking && rankingData && rankingData.length > 0 && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <p className="text-gray-300 text-xs font-medium mb-2">Current Rankings:</p>
              <div className="space-y-1">
                {rankingData.map((ranking) => (
                  <div key={ranking.rank} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {/* Use same icons as chart */}
                      {(ranking.rank === 4 || ranking.rank === 5) ? (
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              fill={ranking.color}
                              fillOpacity={ranking.rank === 5 ? 0.6 : 1}
                              stroke="#FFD700"
                              strokeWidth="2"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="6"
                              fill="none"
                              stroke="#FFD700"
                              strokeWidth="1"
                            />
                            <text
                              x="12"
                              y="13"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="8"
                              fill="#FFFFFF"
                              fontWeight="bold"
                            >
                              {ranking.rank}
                            </text>
                          </svg>
                        </div>
                      ) : (
                        <span className="text-sm">
                          {ranking.emoji}
                        </span>
                      )}
                      <span className="text-gray-300 text-xs">
                        {ranking.user || `Rank #${ranking.rank}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                    <span className="text-gray-100 text-xs font-medium">
                        ${ranking.value.toFixed(2)}
                      </span>
                      <span className={`text-xs ${ranking.profitRatio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ranking.profitRatio >= 0 ? '+' : ''}{ranking.profitRatio.toFixed(2)}%
                    </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show current user's position relative to rankings */}
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border border-white flex items-center justify-center ${isRealTime ? 'bg-green-400' : 'bg-blue-400'}`}>
                    </div>
                    <span className={`text-xs font-medium ${isRealTime ? 'text-green-400' : 'text-blue-400'}`}>
                      {isRealTime ? 'Your Position (Live)' : 'Your Position (Registered)'}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${isRealTime ? 'text-green-400' : 'text-blue-400'}`}>
                    ${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-400 text-xs mt-2">
            {dataPoint?.fullDate}
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

  if (isLoading || isLoadingWeekly) {
    return (
      <Card className="bg-transparent border-0">
        <CardHeader>
          <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse mt-2 w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  // Check if there's data for the selected interval
  const hasData = interval === 'weekly' 
    ? weeklyData?.investorWeeklySnapshots && weeklyData.investorWeeklySnapshots.length > 0
    : data?.investorSnapshots && data.investorSnapshots.length > 0

  if (error || weeklyError || !hasData || chartData.length === 0) {
    return (
      <Card className="bg-transparent border-0">
        <CardHeader className="pb-6">
          <div className="mb-2">
            <h3 className="text-3xl text-gray-100">{t('portfolioValue')}</h3>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <CardTitle className="text-4xl font-bold text-gray-100">$0</CardTitle>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-400">0.00%</span>
              </div>
            </div>
            {/* Show interval selector even when no data */}
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setInterval('daily')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    interval === 'daily' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setInterval('weekly')}
                  className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    interval === 'weekly' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-400">{t('noPortfolioData')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="text-3xl text-gray-100">{t('portfolioValue')}</h3>
            {realTimePortfolio && realTimePortfolio.totalValue > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-400">{t('live')}</span>
              </div>
            )}
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <CardTitle className="text-4xl font-bold text-gray-100">
              ${currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${metrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.isPositive ? '▲' : '▼'} {Math.abs(metrics.gainLossPercentage).toFixed(2)}%
              </span>
            </div>
          </div>
            {/* Interval selector */}
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setInterval('daily')}
                className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    interval === 'daily' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setInterval('weekly')}
                className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    interval === 'weekly' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
                <ResponsiveContainer width="100%" height={320}>
          <AreaChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={(state: any) => {
              if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                setActiveIndexPortfolio(state.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setActiveIndexPortfolio(null)}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
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
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              domain={yAxisDomain}
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
              content={<CustomTooltipPortfolio />} 
              cursor={{ stroke: '#f97316', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="currentUSD"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
            />
            {/* Display ranking dots at current time position */}
            {chartData.length > 0 && (() => {
              const lastDataPoint = chartData[chartData.length - 1]
              if (!lastDataPoint) return null
              
              return rankingData.map((ranking) => {
                const RankingPulsingDot = (props: any) => (
                  <g>
                    <defs>
                      <filter id={`glow-${ranking.rank}`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Custom medal for 4th and 5th place */}
                    {(ranking.rank === 4 || ranking.rank === 5) ? (
                      <g filter={`url(#glow-${ranking.rank})`}>
                        {/* Medal circle */}
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r="10"
                          fill={ranking.color}
                          fillOpacity={ranking.rank === 5 ? 0.6 : 1}
                          stroke="#FFD700"
                          strokeWidth="2"
                        />
                        {/* Inner circle */}
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r="6"
                          fill="none"
                          stroke="#FFD700"
                          strokeWidth="1"
                        />
                        {/* Number */}
                        <text
                          x={props.cx}
                          y={props.cy + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="10"
                          fill="#FFFFFF"
                          fontWeight="bold"
                        >
                          {ranking.rank}
                        </text>
                      </g>
                    ) : (
                      /* Standard emoji for 1st, 2nd, 3rd place */
                      <text
                        x={props.cx}
                        y={props.cy + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="32"
                      >
                        {ranking.emoji}
                      </text>
                    )}
                  </g>
                )
                
                return (
                  <ReferenceDot
                    key={`ranking-dot-${ranking.rank}`}
                    x={lastDataPoint.timeLabel}
                    y={ranking.value}
                    shape={<RankingPulsingDot />}
                  />
                )
              })
            })()}
            
            {/* Display real-time data points as ReferenceDot - HIGHEST PRIORITY */}
            {realTimePortfolio && realTimePortfolio.totalValue > 0 && chartData.length > 0 && (() => {
              const lastDataPoint = chartData[chartData.length - 1]
              if (lastDataPoint && lastDataPoint.isRealTime) {
                const PulsingDot = (props: any) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={8}
                    fill="#22c55e"
                    stroke="#ffffff"
                    strokeWidth={3}
                    style={{ zIndex: 1000 }}
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )
                
                return (
                  <ReferenceDot
                    key={`realtime-ref-dot-${lastDataPoint.id}`}
                    x={lastDataPoint.timeLabel}
                    y={lastDataPoint.currentUSD}
                    shape={<PulsingDot />}
                  />
                )
              }
              return null
            })()}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 