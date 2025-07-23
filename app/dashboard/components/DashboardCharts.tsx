'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActiveChallengesSnapshots } from '../hooks/useActiveChallengesSnapshots'
import { useActiveChallengesWeeklySnapshots } from '../hooks/useActiveChallengesWeeklySnapshots'
import { Users, DollarSign, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { formatDateWithLocale } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  const { data: weeklyData, isLoading: isWeeklyLoading, error: weeklyError } = useActiveChallengesWeeklySnapshots(30, subgraphNetwork)
  
  const [activeIndexParticipants, setActiveIndexParticipants] = useState<number | null>(null)
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly'>('daily')
  const [chartType, setChartType] = useState<'participants' | 'rewards'>('rewards')

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
          // Extract month/day from dateLabel to avoid timezone issues
          const [year, month, day] = actualDate.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })()
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
          // Extract month/day from dateLabel to avoid timezone issues
          const [year, month, day] = actualDate.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })()
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
            {chartType === 'participants' ? t('users') : t('rewards')}
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
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {chartType === 'participants' ? (
                      <>
                        {/* <Users className="h-4 w-4" /> */}
                        {t('users')}
                      </>
                    ) : (
                      <>
                        {/* <DollarSign className="h-4 w-4" /> */}
                        {t('rewards')}
                      </>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={() => setChartType('rewards')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('rewards')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType('participants')}>
                    <Users className="h-4 w-4 mr-2" />
                    {t('users')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Daily/Weekly selector */}
              <div className="flex items-center space-x-2">
                <div className="inline-flex bg-gray-800/60 p-0.5 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <button
                    onClick={() => setIntervalType('daily')}
                    className={`px-6 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                      intervalType === 'daily' 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                    }`}
                  >
                    {t('daily')}
                  </button>
                  <button
                    onClick={() => setIntervalType('weekly')}
                    className={`px-6 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                      intervalType === 'weekly' 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
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
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {chartType === 'participants' ? (
                    <>
                      {t('users')}
                    </>
                  ) : (
                    <>
                      {t('rewards')}
                    </>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                <DropdownMenuItem onClick={() => setChartType('rewards')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t('rewards')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('participants')}>
                  <Users className="h-4 w-4 mr-2" />
                  {t('users')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Daily/Weekly selector */}
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-gray-800/60 p-0.5 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setIntervalType('daily')}
                  className={`px-6 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'daily' 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setIntervalType('weekly')}
                  className={`px-6 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    intervalType === 'weekly' 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 