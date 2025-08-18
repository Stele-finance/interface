'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  tvl: number
  investors: number
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
  
  const [activeIndexTvl, setActiveIndexTvl] = useState<number | null>(null)
  const [activeIndexInvestors, setActiveIndexInvestors] = useState<number | null>(null)
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly'>('daily')
  const [chartType, setChartType] = useState<'tvl' | 'investors'>('tvl')

  const dailyChartData = useMemo(() => {
    // Static mock data for fund dashboard to avoid hydration issues
    const staticTvlValues = [
      12500000, 12750000, 12400000, 13100000, 12900000, 13300000, 13500000, 13200000, 13800000, 13600000,
      14000000, 13900000, 14200000, 14500000, 14300000, 14700000, 14900000, 14600000, 15000000, 14800000,
      15200000, 15100000, 15400000, 15600000, 15300000, 15800000, 15500000, 15900000, 16100000, 16000000
    ]
    
    const staticInvestorValues = [
      850, 865, 840, 890, 875, 905, 920, 900, 935, 925,
      950, 945, 960, 975, 970, 985, 995, 980, 1000, 990,
      1010, 1005, 1020, 1035, 1025, 1040, 1030, 1050, 1065, 1060
    ]
    
    const data = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      data.push({
        id: `daily-${i}`,
        tvl: staticTvlValues[29 - i],
        investors: staticInvestorValues[29 - i],
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
        dateLabel: date.toISOString().split('T')[0],
        timeLabel: (() => {
          const [year, month, day] = date.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })()
      })
    }
    return data
  }, [language])

  const weeklyChartData = useMemo(() => {
    // Static mock data for fund dashboard to avoid hydration issues
    const staticWeeklyTvl = [
      11500000, 12000000, 12800000, 13200000, 13700000, 14100000, 
      14600000, 15000000, 15400000, 15800000, 16200000, 16000000
    ]
    
    const staticWeeklyInvestors = [
      820, 840, 870, 900, 930, 960, 990, 1020, 1050, 1080, 1110, 1060
    ]
    
    const data = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * 7))
      
      data.push({
        id: `weekly-${i}`,
        tvl: staticWeeklyTvl[11 - i],
        investors: staticWeeklyInvestors[11 - i],
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
        dateLabel: date.toISOString().split('T')[0],
        timeLabel: (() => {
          const [year, month, day] = date.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })()
      })
    }
    return data
  }, [language])

  const currentChartData = intervalType === 'daily' ? dailyChartData : weeklyChartData
  const isLoading = false // Using mock data
  const error = null

  // Calculate total values for headers (use the most recent snapshot)
  const totalTvl = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.tvl || 0
  }, [currentChartData])

  const totalInvestors = useMemo(() => {
    if (!currentChartData.length) return 0
    return currentChartData[currentChartData.length - 1]?.investors || 0
  }, [currentChartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value
      const dataKey = payload[0]?.dataKey
      
      return (
        <div className="bg-muted/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-gray-100 text-sm font-medium">
            {dataKey === 'investors' ? `Investors: ${value?.toLocaleString()}` : `TVL: $${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
            {chartType === 'investors' ? 'Investors' : 'TVL'}
          </h3>
          <div className="flex items-center justify-between">
            <CardTitle className="text-4xl text-gray-100">
              {chartType === 'investors' ? (
                hasNoData ? "-" : (totalInvestors >= 1000 ? `${(totalInvestors / 1000).toFixed(1)}K` : totalInvestors.toLocaleString())
              ) : (
                hasNoData ? "-" : `$${totalTvl >= 1000000 ? `${(totalTvl / 1000000).toFixed(1)}M` : totalTvl >= 1000 ? `${(totalTvl / 1000).toFixed(1)}K` : totalTvl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              )}
            </CardTitle>
            
            {/* Desktop Controls - same line as title */}
            <div className="hidden sm:flex items-center gap-4">
              {/* TVL/Investors dropdown */}
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {chartType === 'investors' ? 'Investors' : 'TVL'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={() => setChartType('tvl')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    TVL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType('investors')}>
                    <Users className="h-4 w-4 mr-2" />
                    Investors
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
                      if (chartType === 'investors') {
                        setActiveIndexInvestors(state.activeTooltipIndex)
                      } else {
                        setActiveIndexTvl(state.activeTooltipIndex)
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (chartType === 'investors') {
                      setActiveIndexInvestors(null)
                    } else {
                      setActiveIndexTvl(null)
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="investorsGradient" x1="0" y1="0" x2="0" y2="1">
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
                      if (chartType === 'investors') {
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
                    dataKey={chartType === 'investors' ? 'investors' : 'tvl'} 
                    stroke="#f97316"
                    strokeWidth={2}
                    fill={chartType === 'investors' ? 'url(#investorsGradient)' : 'url(#tvlGradient)'}
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Mobile Controls - below chart */}
          <div className="flex sm:hidden items-center justify-between w-full -mb-4 px-2 gap-4">
            {/* TVL/Investors dropdown */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {chartType === 'investors' ? 'Investors' : 'TVL'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                <DropdownMenuItem onClick={() => setChartType('tvl')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  TVL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('investors')}>
                  <Users className="h-4 w-4 mr-2" />
                  Investors
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