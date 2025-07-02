'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActiveChallengesSnapshots } from '@/app/hooks/useActiveChallengesSnapshots'
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
  const { data, isLoading, error } = useActiveChallengesSnapshots(30, subgraphNetwork)
  const [activeIndexParticipants, setActiveIndexParticipants] = useState<number | null>(null)
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)

  const chartData = useMemo(() => {
    if (!data?.activeChallengesSnapshots) return []

    // Convert data using actual timestamps from the database
    const processedData = data.activeChallengesSnapshots
      .map((snapshot) => {
        // Use actual timestamp from the database
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
          dateLabel: actualDate.toISOString().split('T')[0] // YYYY-MM-DD format
        }
      }) // Data is already sorted by timestamp from the query

    return processedData
  }, [data])

  // Calculate total values for headers (use the most recent snapshot)
  const totalParticipants = useMemo(() => {
    if (!chartData.length) return 0
    // Array is now sorted by date ascending, so last element is most recent
    return chartData[chartData.length - 1]?.totalParticipants || 0
  }, [chartData])

  const totalRewards = useMemo(() => {
    if (!chartData.length) return 0
    // Array is now sorted by date ascending, so last element is most recent
    return chartData[chartData.length - 1]?.totalRewards || 0
  }, [chartData])

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
            {dataKey === 'totalParticipants' ? `${t('participants')}: ${value?.toLocaleString()}` : `${t('rewards')}: $${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

  if (error || !data?.activeChallengesSnapshots || chartData.length === 0) {
    return (
      <div className="mb-6">
        <Card className="bg-transparent border-0">
          <CardHeader>
            <CardTitle className="text-4xl text-gray-100">-</CardTitle>
            <p className="text-sm text-gray-400">{currentDate}</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('noDataAvailable')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <Tabs defaultValue="participants" className="w-full">
        <Card className="bg-transparent border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <TabsContent value="participants" className="m-0">
                  <h3 className="text-3xl text-gray-100">{t('totalParticipants')}</h3>
                </TabsContent>
                <TabsContent value="rewards" className="m-0">
                  <h3 className="text-2xl text-gray-100">{t('totalRewards')}</h3>
                </TabsContent>
              </div>
              <TabsList className="grid grid-cols-2 bg-gray-800/50">
                <TabsTrigger value="participants" className="data-[state=active]:bg-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  {t('participants')}
                </TabsTrigger>
                <TabsTrigger value="rewards" className="data-[state=active]:bg-gray-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t('rewards')}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="participants" className="mt-0">
              <div className="mb-2">
                <CardTitle className="text-4xl text-gray-100">
                  {totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K` : totalParticipants.toLocaleString()}
                </CardTitle>
                <p className="text-sm text-gray-400">{currentDate}</p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                    fontSize={11}
                    tick={{ fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
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
            </TabsContent>

            <TabsContent value="rewards" className="mt-0">
              <div className="mb-2">
                <CardTitle className="text-4xl text-gray-100">
                  ${totalRewards >= 1000000 ? `${(totalRewards / 1000000).toFixed(1)}M` : totalRewards >= 1000 ? `${(totalRewards / 1000).toFixed(1)}K` : totalRewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </CardTitle>
                <p className="text-sm text-gray-400">{currentDate}</p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                    dataKey="totalRewards" 
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#rewardsGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
} 