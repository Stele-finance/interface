'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, ChevronDown, Calendar } from 'lucide-react'
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
import { useInfoSnapshots, formatSnapshotDataForChart, SnapshotType } from '../hooks/useInfoSnapshots'

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
  const [intervalType, setIntervalType] = useState<SnapshotType>('daily')
  const [chartType, setChartType] = useState<'tvl' | 'investors'>('tvl')

  // Fetch snapshot data based on interval type
  const { data: snapshotData, isLoading, error } = useInfoSnapshots({
    type: intervalType,
    network: subgraphNetwork,
    first: intervalType === 'daily' ? 30 : intervalType === 'weekly' ? 12 : 12 // 30 days, 12 weeks, or 12 months
  })

  // Process snapshot data for charts
  const currentChartData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0) return []
    
    const formattedData = formatSnapshotDataForChart(snapshotData)
    
    return formattedData.map((item, index) => ({
      id: `${intervalType}-${index}`,
      tvl: item.tvl,
      investors: item.investorCount,
      formattedDate: formatDateWithLocale(new Date(item.timestamp * 1000), language, { 
        month: 'short', 
        day: 'numeric'
      }),
      fullDate: formatDateWithLocale(new Date(item.timestamp * 1000), language, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      dateLabel: item.date,
      timeLabel: (() => {
        const date = new Date(item.timestamp * 1000)
        const month = date.getMonth() + 1
        const day = date.getDate()
        
        if (intervalType === 'monthly') {
          return `${month}/${String(date.getFullYear()).slice(2)}`
        } else {
          return `${month}/${day}`
        }
      })()
    }))
  }, [snapshotData, intervalType, language])

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

  if (isLoading || !snapshotData) {
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
              
              {/* Time interval dropdown */}
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Calendar className="h-4 w-4" />
                    {intervalType === 'daily' ? t('daily') : intervalType === 'weekly' ? t('weekly') : t('monthly')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={() => setIntervalType('daily')}>
                    {t('daily')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIntervalType('weekly')}>
                    {t('weekly')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIntervalType('monthly')}>
                    {t('monthly')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            
            {/* Time interval dropdown */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Calendar className="h-4 w-4" />
                  {intervalType === 'daily' ? t('daily') : intervalType === 'weekly' ? t('weekly') : t('monthly')}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                <DropdownMenuItem onClick={() => setIntervalType('daily')}>
                  {t('daily')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIntervalType('weekly')}>
                  {t('weekly')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIntervalType('monthly')}>
                  {t('monthly')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}