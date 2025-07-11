'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActiveChallengesSnapshots } from '@/app/hooks/useActiveChallengesSnapshots'
import { useActiveChallengesWeeklySnapshots } from '@/app/hooks/useActiveChallengesWeeklySnapshots'
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLanguage } from '@/lib/language-context'

interface ChartDataPoint {
  id: string
  totalParticipants: number
  totalRewards: number
  formattedDate: string
  fullDate: string
  timeLabel: string
  dateLabel: string
}

interface DashboardChartsProps {
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
}

export function DashboardCharts({ network }: DashboardChartsProps) {
  const { t } = useLanguage()
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  // Daily data
  const { data: dailyData, isLoading: isDailyLoading, error: dailyError } = useActiveChallengesSnapshots(30, subgraphNetwork)
  
  // Weekly data
  const { data: weeklyData, isLoading: isWeeklyLoading, error: weeklyError } = useActiveChallengesWeeklySnapshots(30, subgraphNetwork)
  
  const [activeIndexParticipants, setActiveIndexParticipants] = useState<number | null>(null)
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly'>('daily')
  const [chartType, setChartType] = useState<'participants' | 'rewards'>('participants')

  const dailyChartData = useMemo(() => {
    if (!dailyData?.activeChallengesSnapshots) return []

    return dailyData.activeChallengesSnapshots.map((snapshot) => {
      const actualDate = new Date(Number(snapshot.timestamp) * 1000)
      
      return {
        id: snapshot.id,
        totalParticipants: Number(snapshot.totalParticipants),
        totalRewards: Number(snapshot.totalRewards),
        formattedDate: actualDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: actualDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        timeLabel: actualDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        dateLabel: actualDate.toISOString().split('T')[0]
      }
    })
  }, [dailyData])

  const weeklyChartData = useMemo(() => {
    if (!weeklyData?.activeChallengesWeeklySnapshots) return []

    return weeklyData.activeChallengesWeeklySnapshots.map((snapshot) => {
      const actualDate = new Date(Number(snapshot.timestamp) * 1000)
      
      return {
        id: snapshot.id,
        totalParticipants: Number(snapshot.totalParticipants),
        totalRewards: Number(snapshot.totalRewards),
        formattedDate: actualDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: actualDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        timeLabel: actualDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        dateLabel: actualDate.toISOString().split('T')[0]
      }
    })
  }, [weeklyData])

  const currentChartData = intervalType === 'daily' ? dailyChartData : weeklyChartData
  const isLoading = intervalType === 'daily' ? isDailyLoading : isWeeklyLoading
  const error = intervalType === 'daily' ? dailyError : weeklyError

  // Calculate total values for headers (use the most recent snapshot)
  const totalParticipants = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.totalParticipants || 0
  }, [currentChartData])

  const totalRewards = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.totalRewards || 0
  }, [currentChartData])

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
      const dataKey = payload[0]?.dataKey
      
      return (
        <div className="bg-gray-800/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-gray-100 text-sm font-medium">
            {dataKey === 'totalParticipants' ? `${t('users')}: ${value?.toLocaleString()}` : `${t('rewards')}: $${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

  if (isLoading) {
    return (
      <div className="mb-6">
        <Card className="bg-transparent border-0">
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

  const hasNoData = error || currentChartData.length === 0

  return (
    <div className="mb-4 sm:mb-6">
      <Card className="bg-transparent border-0">
        <CardHeader className="pb-2 px-2 sm:px-6">
          <div className="mb-2">
            <h3 className="text-3xl text-gray-100">
              {chartType === 'participants' ? t('totalParticipants') : t('totalRewards')}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          {chartType === 'participants' && (
            <div className="mt-0">
              <div className="flex flex-col gap-3 mb-2">
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <CardTitle className="text-2xl text-gray-100">
                      {hasNoData ? "-" : (totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K` : totalParticipants.toLocaleString())}
                    </CardTitle>
                    {/* Interval selector - same row as number on mobile */}
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">{currentDate}</p>
                    {/* Chart type selector - same row as date on mobile */}
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                        <button
                          onClick={() => setChartType('participants')}
                          className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                            chartType === 'participants' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                          }`}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {t('users')}
                        </button>
                        <button
                          onClick={() => setChartType('rewards')}
                          className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                            (chartType as string) === 'rewards' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                          }`}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t('rewards')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop layout */}
                <div className="hidden sm:block">
                  <CardTitle className="text-4xl text-gray-100 mb-2">
                    {hasNoData ? "-" : (totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K` : totalParticipants.toLocaleString())}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{currentDate}</p>
                    <div className="flex items-center gap-4">
                      {/* Interval selector */}
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
                      {/* Chart type selector */}
                      <div className="flex items-center space-x-2">
                        <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                          <button
                            onClick={() => setChartType('participants')}
                            className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                              chartType === 'participants' 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                            }`}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {t('users')}
                          </button>
                          <button
                            onClick={() => setChartType('rewards')}
                            className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                              (chartType as string) === 'rewards' 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                            }`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {t('rewards')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {hasNoData ? (
                <div className="h-64 sm:h-80 flex items-center justify-center">
                  <p className="text-gray-400">{t('noDataAvailable')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                  <AreaChart 
                    data={currentChartData} 
                    margin={{ top: 20, right: 5, left: -10, bottom: 20 }}
                    onMouseMove={(state: any) => {
                      if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                        setActiveIndexParticipants(state.activeTooltipIndex)
                      }
                    }}
                    onMouseLeave={() => setActiveIndexParticipants(null)}
                  >
                    <defs>
                      <linearGradient id="participantsGradient" x1="0" y1="0" x2="0" y2="1">
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
                          return `${(value / 1000000).toFixed(1)}M`
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`
                        } else {
                          return `${value.toFixed(0)}`
                        }
                      }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: '#f97316', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalParticipants" 
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#participantsGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {chartType === 'rewards' && (
            <div className="mt-0">
              <div className="flex flex-col gap-3 mb-2">
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <CardTitle className="text-2xl text-gray-100">
                      {hasNoData ? "-" : `$${totalRewards >= 1000000 ? `${(totalRewards / 1000000).toFixed(1)}M` : totalRewards >= 1000 ? `${(totalRewards / 1000).toFixed(1)}K` : totalRewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </CardTitle>
                    {/* Interval selector - same row as number on mobile */}
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">{currentDate}</p>
                    {/* Chart type selector - same row as date on mobile */}
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                        <button
                          onClick={() => setChartType('participants')}
                          className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                            (chartType as string) === 'participants' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                          }`}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {t('users')}
                        </button>
                        <button
                          onClick={() => setChartType('rewards')}
                          className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                            chartType === 'rewards' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                          }`}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t('rewards')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop layout */}
                <div className="hidden sm:block">
                  <CardTitle className="text-4xl text-gray-100 mb-2">
                    {hasNoData ? "-" : `$${totalRewards >= 1000000 ? `${(totalRewards / 1000000).toFixed(1)}M` : totalRewards >= 1000 ? `${(totalRewards / 1000).toFixed(1)}K` : totalRewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{currentDate}</p>
                    <div className="flex items-center gap-4">
                      {/* Interval selector */}
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
                      {/* Chart type selector */}
                      <div className="flex items-center space-x-2">
                        <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                          <button
                            onClick={() => setChartType('participants')}
                            className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                              (chartType as string) === 'participants' 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                            }`}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {t('users')}
                          </button>
                          <button
                            onClick={() => setChartType('rewards')}
                            className={`px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 ease-in-out flex items-center ${
                              chartType === 'rewards' 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                            }`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {t('rewards')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {hasNoData ? (
                <div className="h-64 sm:h-80 flex items-center justify-center">
                  <p className="text-gray-400">{t('noDataAvailable')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                  <AreaChart 
                    data={currentChartData} 
                    margin={{ top: 20, right: 5, left: -10, bottom: 20 }}
                    onMouseMove={(state: any) => {
                      if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                        setActiveIndexRewards(state.activeTooltipIndex)
                      }
                    }}
                    onMouseLeave={() => setActiveIndexRewards(null)}
                  >
                    <defs>
                      <linearGradient id="rewardsGradient" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="totalRewards" 
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#rewardsGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 