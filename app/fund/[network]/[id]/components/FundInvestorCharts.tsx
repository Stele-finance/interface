'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { formatDateWithLocale } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { DollarSign, Coins, User, ChevronDown, Calendar } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from 'next/image'
import { useInvestorSnapshots, InvestorSnapshotType } from "../hooks/useInvestorSnapshots"

interface FundInvestorChartsProps {
  fundId: string
  investor: string
  network: 'ethereum' | 'arbitrum'
  isLoadingInvestor?: boolean
  intervalType?: InvestorSnapshotType
  fundData?: any // Fund data for calculating share ratio
  investorData?: any // Investor data for current share
  tokensWithPrices?: any[] // Real-time token prices
}

export function FundInvestorCharts({ fundId, investor, network, isLoadingInvestor = false, intervalType = 'daily', fundData, investorData, tokensWithPrices }: FundInvestorChartsProps) {
  const { t, language } = useLanguage()
  
  // Format investor address for display
  const formatInvestorAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // Fetch investor snapshots data
  const { data: snapshotsData, isLoading: isLoadingSnapshots, error: snapshotsError } = useInvestorSnapshots({
    fundId,
    investor,
    type: intervalType,
    network,
    first: intervalType === 'daily' ? 30 : intervalType === 'weekly' ? 12 : 12
  })

  // Calculate real-time portfolio value using latest snapshot tokens and current prices
  const realTimePortfolioValue = useMemo(() => {
    if (!investorData?.investor || !fundData?.fund || !tokensWithPrices || tokensWithPrices.length === 0) {
      return null
    }

    // Get the latest snapshot to use its token data structure
    if (!snapshotsData?.investorSnapshots || snapshotsData.investorSnapshots.length === 0) {
      return null
    }

    // Calculate share ratio: investor.share / fund.share
    const investorShare = parseFloat(investorData.investor.share || '0')
    const fundShare = parseFloat(fundData.fund.share || '0')
    const shareRatio = fundShare > 0 ? investorShare / fundShare : 0

    if (shareRatio === 0) return null

    // Calculate real-time value using fund tokens and current prices
    let totalValue = 0
    let hasRealTimeData = false

    fundData.fund.tokensSymbols.forEach((symbol: string, index: number) => {
      const fundTokenAmount = parseFloat(fundData.fund.tokensAmount?.[index] || '0')
      const investorTokenAmount = fundTokenAmount * shareRatio
      
      // Find current price for this token
      const tokenWithPrice = tokensWithPrices.find(t => t.symbol === symbol)
      if (tokenWithPrice?.price) {
        totalValue += investorTokenAmount * tokenWithPrice.price
        hasRealTimeData = true
      }
    })

    return hasRealTimeData ? totalValue : null
  }, [investorData, fundData, tokensWithPrices, snapshotsData])

  // Transform investor snapshots data for chart
  const chartData = useMemo(() => {
    if (!snapshotsData?.investorSnapshots || snapshotsData.investorSnapshots.length === 0) {
      return []
    }
    
    const snapshots = snapshotsData.investorSnapshots.map((snapshot) => {
      const date = new Date(parseInt(snapshot.timestamp) * 1000)
      const amountUSD = parseFloat(snapshot.amountUSD)
      const profitUSD = parseFloat(snapshot.profitUSD)
      
      return {
        id: snapshot.id,
        amountUSD,
        profitUSD,
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
        timeLabel: (() => {
          const month = date.getMonth() + 1
          const day = date.getDate()
          
          if (intervalType === 'monthly') {
            return `${month}/${String(date.getFullYear()).slice(2)}`
          } else {
            return `${month}/${day}`
          }
        })(),
        timestamp: parseInt(snapshot.timestamp),
      }
    }).sort((a, b) => a.timestamp - b.timestamp)

    // Add LIVE data point if we have real-time data
    if (realTimePortfolioValue !== null && snapshots.length > 0) {
      const now = new Date()
      const month = now.getMonth() + 1
      const day = now.getDate()
      
      const liveDataPoint = {
        id: 'live',
        amountUSD: realTimePortfolioValue,
        profitUSD: 0, // We'll calculate this based on the first investment
        formattedDate: 'Live',
        fullDate: 'Real-time data',
        timeLabel: intervalType === 'monthly' 
          ? `${month}/${String(now.getFullYear()).slice(2)}-Live`
          : `${month}/${day}-Live`,
        timestamp: Math.floor(now.getTime() / 1000),
        isLive: true
      }
      
      return [...snapshots, liveDataPoint]
    }

    return snapshots
  }, [snapshotsData, language, intervalType, realTimePortfolioValue])

  // Calculate current value (use the most recent snapshot)
  const currentValue = useMemo(() => {
    if (chartData.length > 0) {
      const latestSnapshot = chartData[chartData.length - 1]?.amountUSD || 0
      return latestSnapshot
    }
    return 0
  }, [chartData])

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
            Value: ${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoadingInvestor || isLoadingSnapshots) {
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

  if (snapshotsError || chartData.length === 0) {
    return (
      <Card className="bg-transparent border-0">
        <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6 pt-2 sm:pt-6">
          {/* First row: Address, Action Buttons, and Registered status */}
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-500" />
                <h3 className="text-2xl sm:text-3xl text-gray-100">
                  {formatInvestorAddress(investor)}
                </h3>
              </div>
            </div>
          </div>
          
          {/* Second row: Portfolio value */}
          <div className="flex items-baseline justify-between gap-2 sm:gap-3">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <CardTitle className="text-4xl font-bold text-gray-100">$0</CardTitle>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-400">0.00%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pt-0 pb-2 sm:pb-4">
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-400">
              {snapshotsError ? 'Error loading investor data' : 'No investor snapshots available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6 pt-2 sm:pt-6">
        {/* First row: Address, Action Buttons, and Registered status */}
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-500" />
              <h3 className="text-2xl sm:text-3xl text-gray-100">
                {formatInvestorAddress(investor)}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Second row: Portfolio value */}
        <div className="flex items-baseline justify-between gap-2 sm:gap-3">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <CardTitle className="text-4xl font-bold text-gray-100">
              ${(Math.floor(currentValue * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-0 md:mr-6 pt-0 pb-0 sm:pb-0 -ml-4">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart 
            data={chartData} 
            margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
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
              minTickGap={30}
            />
            <YAxis
              orientation="left"
              stroke="#9CA3AF"
              fontSize={11}
              tick={{ fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
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
              dataKey="amountUSD"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
            />
            
            {/* Add green reference dot for LIVE data point with pulsing animation - matching challenge page UI/UX */}
            {realTimePortfolioValue !== null && chartData.length > 0 && (() => {
              const liveDataPoint = chartData.find(d => 'isLive' in d && d.isLive)
              if (liveDataPoint) {
                const PulsingDot = (props: any) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={8}
                    fill="#22c55e"
                    stroke="#ffffff"
                    strokeWidth={3}
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
                    key="live-dot"
                    x={liveDataPoint.timeLabel}
                    y={liveDataPoint.amountUSD}
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