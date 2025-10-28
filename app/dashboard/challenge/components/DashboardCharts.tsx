'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActiveChallengesSnapshots } from '../hooks/useActiveChallengesSnapshots'
import { useActiveChallengesWeeklySnapshots } from '../hooks/useActiveChallengesWeeklySnapshots'
import { useActiveChallengesMonthlySnapshots } from '../hooks/useActiveChallengesMonthlySnapshots'
import { Users, DollarSign, ChevronDown, Calendar } from 'lucide-react'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import { formatDateWithLocale } from '@/lib/utils'

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
  const { t, language } = useLanguage()
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  // Daily data
  const { data: dailyData, isLoading: isDailyLoading, error: dailyError } = useActiveChallengesSnapshots(30, subgraphNetwork)
  
  // Weekly data
  const { data: weeklyData, isLoading: isWeeklyLoading, error: weeklyError } = useActiveChallengesWeeklySnapshots(12, subgraphNetwork)
  
  // Monthly data
  const { data: monthlyData, isLoading: isMonthlyLoading, error: monthlyError } = useActiveChallengesMonthlySnapshots(12, subgraphNetwork)
  
  const [activeIndexParticipants, setActiveIndexParticipants] = useState<number | null>(null)
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [chartType, setChartType] = useState<'participants' | 'rewards'>('rewards')
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false)
  const chartTypeRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chartTypeRef.current && !chartTypeRef.current.contains(event.target as Node)) {
        setShowChartTypeDropdown(false)
      }
      if (intervalRef.current && !intervalRef.current.contains(event.target as Node)) {
        setShowIntervalDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [])

  const dailyChartData = useMemo(() => {
    if (!dailyData?.activeChallengesSnapshots) return []

    return dailyData.activeChallengesSnapshots.map((snapshot) => {
      const actualDate = new Date(Number(snapshot.timestamp) * 1000)
      
      return {
        id: snapshot.id,
        totalParticipants: Number(snapshot.totalParticipants),
        totalRewards: Number(snapshot.totalRewards),
        formattedDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        dateLabel: actualDate.toISOString().split('T')[0],
        timeLabel: (() => {
          const month = actualDate.getMonth() + 1
          const day = actualDate.getDate()
          return `${month}/${day}`
        })()
      }
    })
  }, [dailyData, language])

  const weeklyChartData = useMemo(() => {
    if (!weeklyData?.activeChallengesWeeklySnapshots) return []

    return weeklyData.activeChallengesWeeklySnapshots.map((snapshot) => {
      const actualDate = new Date(Number(snapshot.timestamp) * 1000)
      
      return {
        id: snapshot.id,
        totalParticipants: Number(snapshot.totalParticipants),
        totalRewards: Number(snapshot.totalRewards),
        formattedDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        dateLabel: actualDate.toISOString().split('T')[0],
        timeLabel: (() => {
          const month = actualDate.getMonth() + 1
          const day = actualDate.getDate()
          return `${month}/${day}`
        })()
      }
    })
  }, [weeklyData, language])

  const monthlyChartData = useMemo(() => {
    if (!monthlyData?.activeChallengesMonthlySnapshots) return []

    return monthlyData.activeChallengesMonthlySnapshots.map((snapshot) => {
      const actualDate = new Date(Number(snapshot.timestamp) * 1000)
      
      return {
        id: snapshot.id,
        totalParticipants: Number(snapshot.totalParticipants),
        totalRewards: Number(snapshot.totalRewards),
        formattedDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: formatDateWithLocale(actualDate, language, { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        dateLabel: actualDate.toISOString().split('T')[0],
        timeLabel: (() => {
          const month = actualDate.getMonth() + 1
          const year = actualDate.getFullYear()
          return `${month}/${String(year).slice(2)}`
        })()
      }
    })
  }, [monthlyData, language])

  const currentChartData = intervalType === 'daily' ? dailyChartData : intervalType === 'weekly' ? weeklyChartData : monthlyChartData
  const isLoading = intervalType === 'daily' ? isDailyLoading : intervalType === 'weekly' ? isWeeklyLoading : isMonthlyLoading
  const error = intervalType === 'daily' ? dailyError : intervalType === 'weekly' ? weeklyError : monthlyError

  // Calculate total values for headers (use the most recent snapshot)
  const totalParticipants = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.totalParticipants || 0
  }, [currentChartData])

  const totalRewards = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.totalRewards || 0
  }, [currentChartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value
      const dataKey = payload[0]?.dataKey
      
      return (
        <div className="bg-muted/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-gray-100 text-sm font-medium">
            {dataKey === 'totalParticipants' ? `${t('users')}: ${value?.toLocaleString()}` : `${t('rewards')}: $${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      )
    }
    return null
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
          {/* Title only */}
          <h3 className="text-3xl text-gray-100 mb-2">
            {chartType === 'participants' ? t('users') : t('totalPrize')}
          </h3>
          <div className="flex items-center justify-between">
            <CardTitle className="text-4xl text-gray-100">
              {chartType === 'participants' ? (
                hasNoData ? "-" : (totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K` : totalParticipants.toLocaleString())
              ) : (
                hasNoData ? "-" : `$${totalRewards >= 1000000 ? `${(totalRewards / 1000000).toFixed(1)}M` : totalRewards >= 1000 ? `${(totalRewards / 1000).toFixed(1)}K` : totalRewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              )}
            </CardTitle>
            
            {/* Desktop Controls - same line as title */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Users/Rewards dropdown */}
              <div className="relative" ref={chartTypeRef}>
                <button
                  onClick={() => {
                    setShowChartTypeDropdown(!showChartTypeDropdown)
                    setShowIntervalDropdown(false)
                  }}
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                >
                  {chartType === 'participants' ? t('users') : t('totalPrize')}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showChartTypeDropdown && (
                  <div className="absolute top-full mt-2 w-32 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                    <button
                      onClick={() => {
                        setChartType('rewards')
                        setShowChartTypeDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {t('totalPrize')}
                    </button>
                    <button
                      onClick={() => {
                        setChartType('participants')
                        setShowChartTypeDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {t('users')}
                    </button>
                  </div>
                )}
              </div>

              {/* Time interval dropdown */}
              <div className="relative" ref={intervalRef}>
                <button
                  onClick={() => {
                    setShowIntervalDropdown(!showIntervalDropdown)
                    setShowChartTypeDropdown(false)
                  }}
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                >
                  <Calendar className="h-4 w-4" />
                  {intervalType === 'daily' ? t('daily') : intervalType === 'weekly' ? t('weekly') : t('monthly')}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showIntervalDropdown && (
                  <div className="absolute top-full mt-2 w-32 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                    <button
                      onClick={() => {
                        setIntervalType('daily')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('daily')}
                    </button>
                    <button
                      onClick={() => {
                        setIntervalType('weekly')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('weekly')}
                    </button>
                    <button
                      onClick={() => {
                        setIntervalType('monthly')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('monthly')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          {/* Chart */}
          <div className="mt-0 mb-0">
            {hasNoData ? (
              <div className="h-64 sm:h-80 flex items-center justify-center">
                <p className="text-gray-400">{t('noDataAvailable')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                <AreaChart 
                  data={currentChartData} 
                  margin={{ top: 20, right: 5, left: 5, bottom: 20 }}
                  onMouseMove={(state: any) => {
                    if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                      if (chartType === 'participants') {
                        setActiveIndexParticipants(state.activeTooltipIndex)
                      } else {
                        setActiveIndexRewards(state.activeTooltipIndex)
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (chartType === 'participants') {
                      setActiveIndexParticipants(null)
                    } else {
                      setActiveIndexRewards(null)
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="participantsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                    </linearGradient>
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
                    width={35}
                    tickFormatter={(value) => {
                      if (chartType === 'participants') {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`
                        } else {
                          return `${value.toFixed(0)}`
                        }
                      } else {
                        if (value >= 1000000) {
                          return `$${(value / 1000000).toFixed(1)}M`
                        } else if (value >= 1000) {
                          return `$${(value / 1000).toFixed(0)}K`
                        } else {
                          return `$${value.toFixed(0)}`
                        }
                      }
                    }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#f97316', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartType === 'participants' ? 'totalParticipants' : 'totalRewards'} 
                    stroke="#f97316"
                    strokeWidth={2}
                    fill={chartType === 'participants' ? 'url(#participantsGradient)' : 'url(#rewardsGradient)'}
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Mobile Controls - below chart */}
          <div className="flex sm:hidden items-center justify-between w-full -mb-4 px-2 gap-4">
            {/* Users/Rewards dropdown */}
            <div className="relative" ref={chartTypeRef}>
              <button
                onClick={() => {
                  setShowChartTypeDropdown(!showChartTypeDropdown)
                  setShowIntervalDropdown(false)
                }}
                className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
              >
                {chartType === 'participants' ? t('users') : t('totalPrize')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showChartTypeDropdown && (
                <div className="absolute top-full mt-2 w-32 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                  <button
                    onClick={() => {
                      setChartType('rewards')
                      setShowChartTypeDropdown(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('totalPrize')}
                  </button>
                  <button
                    onClick={() => {
                      setChartType('participants')
                      setShowChartTypeDropdown(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t('users')}
                  </button>
                </div>
              )}
            </div>

            {/* Time interval dropdown */}
            <div className="relative" ref={intervalRef}>
              <button
                onClick={() => {
                  setShowIntervalDropdown(!showIntervalDropdown)
                  setShowChartTypeDropdown(false)
                }}
                className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
              >
                <Calendar className="h-4 w-4" />
                {intervalType === 'daily' ? t('daily') : intervalType === 'weekly' ? t('weekly') : t('monthly')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showIntervalDropdown && (
                <div className="absolute top-full mt-2 w-32 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                  <button
                    onClick={() => {
                      setIntervalType('daily')
                      setShowIntervalDropdown(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                  >
                    {t('daily')}
                  </button>
                  <button
                    onClick={() => {
                      setIntervalType('weekly')
                      setShowIntervalDropdown(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                  >
                    {t('weekly')}
                  </button>
                  <button
                    onClick={() => {
                      setIntervalType('monthly')
                      setShowIntervalDropdown(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                  >
                    {t('monthly')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 