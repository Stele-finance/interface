'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { formatDateWithLocale } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, PieChart } from 'lucide-react'
import Image from 'next/image'
import { useFundInvestorSnapshots } from "../hooks/useFundInvestorSnapshots"

interface FundInvestorChartsProps {
  fundId: string
  investor: string
  network: 'ethereum' | 'arbitrum'
  isLoadingInvestor?: boolean
}

export function FundInvestorCharts({ fundId, investor, network, isLoadingInvestor = false }: FundInvestorChartsProps) {
  const { t, language } = useLanguage()
  
  // Format investor address for display
  const formatInvestorAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // Fetch investor snapshots data
  const { data: snapshotsData, isLoading: isLoadingSnapshots, error: snapshotsError } = useFundInvestorSnapshots(fundId, investor, network)

  // Transform investor snapshots data for chart
  const chartData = useMemo(() => {
    if (!snapshotsData?.investorSnapshots || snapshotsData.investorSnapshots.length === 0) {
      return []
    }
    
    return snapshotsData.investorSnapshots.map((snapshot) => {
      const date = new Date(parseInt(snapshot.timestamp) * 1000)
      const currentUSD = parseFloat(snapshot.currentUSD)
      const principalUSD = parseFloat(snapshot.principalUSD)
      
      return {
        id: snapshot.id,
        currentUSD,
        principalUSD,
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
          const [year, month, day] = date.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })(),
        timestamp: parseInt(snapshot.timestamp),
      }
    }).sort((a, b) => a.timestamp - b.timestamp)
  }, [snapshotsData, language])

  // Calculate current value (use the most recent snapshot)
  const currentValue = useMemo(() => {
    if (chartData.length > 0) {
      const latestSnapshot = chartData[chartData.length - 1]?.currentUSD || 0
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
                <PieChart className="w-6 h-6 text-blue-500" />
                <h3 className="text-2xl sm:text-3xl text-gray-100">
                  {formatInvestorAddress(investor)}
                </h3>
              </div>
            </div>
          </div>
          
          {/* Second row: Portfolio value and interval selector */}
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
              <PieChart className="w-6 h-6 text-blue-500" />
              <h3 className="text-2xl sm:text-3xl text-gray-100">
                {formatInvestorAddress(investor)}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Second row: Portfolio value and interval selector */}
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
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
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
              cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="currentUSD" 
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 