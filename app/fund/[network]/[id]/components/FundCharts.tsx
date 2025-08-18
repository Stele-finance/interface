'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { formatDateWithLocale } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { DollarSign, Plus, User, Loader2, Wallet, Share2, Copy, Trophy, PieChart } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

interface FundChartsProps {
  fundId: string
  network: 'ethereum' | 'arbitrum' | null
  investButton?: {
    isClient: boolean
    shouldShowGetRewards: boolean
    hasInvestedInFund: boolean
    isFundClosed: boolean
    isJoining: boolean
    isLoadingFund: boolean
    fundData: any
    isGettingRewards: boolean
    handleInvestInFund: () => void
    handleNavigateToAccount: () => void
    handleGetRewards: () => void
    t: (key: any) => string
    // Wallet connection props
    isConnected: boolean
    walletSelectOpen: boolean
    setWalletSelectOpen: (open: boolean) => void
    isConnecting: boolean
    handleConnectWallet: () => Promise<void>
  }
}

export function FundCharts({ fundId, network, investButton }: FundChartsProps) {
  const { t, language } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const [intervalType, setIntervalType] = useState<'daily' | 'weekly'>('daily')
  const [activeIndexRewards, setActiveIndexRewards] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second for accurate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Mock data for fund charts - TVL progression over time (deterministic)
  const mockFundData = useMemo(() => {
    const baseDate = new Date('2024-01-01')
    const data = []
    
    // Deterministic seed values for consistent rendering
    const seedValues = [
      12500, 8300, 15800, 22100, 7400, 19600, 11200, 16900, 24300, 9700,
      13800, 20500, 6800, 17400, 25100, 10300, 14600, 21800, 8900, 18200,
      26400, 11700, 15300, 23600, 7200, 19900, 12800, 17100, 25800, 9400
    ]
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000)
      const tvlUSD = 50000 + seedValues[i] + i * 1000 // Growing TVL with deterministic variance
      
      data.push({
        id: `fund-snapshot-${i}`,
        investorCount: Math.floor(10 + (seedValues[i] % 20) / 1000 + i * 0.5),
        tvlUSD: tvlUSD,
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
        dateLabel: date.toISOString().split('T')[0], // YYYY-MM-DD format
        timeLabel: (() => {
          // Extract month/day from dateLabel to avoid timezone issues
          const [year, month, day] = date.toISOString().split('T')[0].split('-')
          return `${parseInt(month)}/${parseInt(day)}`
        })(),
      })
    }
    
    return data.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel))
  }, [language])

  const chartData = mockFundData

  // Calculate current TVL (use the most recent snapshot)
  const currentTVL = useMemo(() => {
    if (chartData.length > 0) {
      const latestSnapshot = chartData[chartData.length - 1]?.tvlUSD || 0
      return latestSnapshot
    }
    return 72000 // Default mock TVL
  }, [chartData])

  // Get fund details
  const getFundDetails = () => {
    return {
      participants: 15,
      createdTime: new Date('2024-01-01'),
      isActive: true,
      totalValue: currentTVL,
    }
  }

  const fundDetails = getFundDetails()

  // Get current date for header
  const currentDate = formatDateWithLocale(new Date(), language, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  // Share functionality
  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href
      await navigator.clipboard.writeText(currentUrl)
      toast({
        title: t('linkCopied'),
        description: t('fundLinkCopiedToClipboard'),
      })
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast({
        title: t('copyFailed'),
        description: t('unableToCopyLinkToClipboard'),
        variant: "destructive",
      })
    }
  }

  const handleShareToTwitter = () => {
    const currentUrl = window.location.href
    const tweetText = t('shareToTwitterTemplate')
      .replace('{fundId}', fundId)
      .replace('${totalValue}', currentTVL.toLocaleString())
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(currentUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value
      
      return (
        <div className="bg-gray-800/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-gray-100 text-sm font-medium">
            TVL: ${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  const isLoading = false
  const error = null

  if (isLoading) {
    return (
      <div className="mb-6">
        <Card className="bg-transparent border-0 -mt-12">
          <CardHeader className="pb-2 px-1 sm:px-6 md:-ml-2">
            <div className="h-8 bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent className="px-1 sm:px-6 md:-ml-2">
            <div className="h-80 bg-gray-700 rounded animate-pulse mb-4"></div>
            {/* Daily/Weekly buttons skeleton */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50">
                <div className="w-16 h-8 bg-gray-700 rounded-full animate-pulse mr-1"></div>
                <div className="w-16 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* Separator */}
            <div className="border-t border-gray-600/50 mx-2 sm:mx-0 pt-2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-muted border-gray-700/50 lg:col-span-2">
          <CardHeader>
            <div className="mb-2">
              <h3 className="text-3xl text-gray-100">TVL</h3>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-4xl text-gray-100">$72,000</CardTitle>
            </div>
            <p className="text-sm text-gray-400">{currentDate}</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('noDataAvailable')}</p>
            </div>
          </CardContent>
          
          {/* Interval selector - Below chart */}
          <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2">
            <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
              <button
                onClick={() => setIntervalType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                  intervalType === 'daily' 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                {t('daily')}
              </button>
              <button
                onClick={() => setIntervalType('weekly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                  intervalType === 'weekly' 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                {t('weekly')}
              </button>
            </div>
          </div>
          
          {/* Separator Bar - Below daily/weekly buttons, chart width */}
          <div className="pr-6 mb-4 pt-2">
            <div className="border-t border-gray-600/50"></div>
          </div>
        </Card>
        
        <Card className="bg-muted border-gray-700/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100">Fund Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">{t('loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Total TVL Chart */}
      <Card className="bg-transparent border-0 -mt-12">
        <CardHeader className="pb-2 px-1 sm:px-6 md:-ml-2">
          {/* Mobile layout */}
          <div className="block md:hidden">
            {/* First row: Fund title only */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <PieChart className="w-8 h-8 text-blue-500" />
                  {/* Show network icon only when connected to Arbitrum */}
                  {network === 'arbitrum' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                      <Image 
                        src="/networks/small/arbitrum.png" 
                        alt="Arbitrum"
                        width={16}
                        height={16}
                        className="rounded-full"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </div>
                  )}
                </div>
                <h3 className="text-3xl text-gray-100">{t('fund')} {fundId}</h3>
              </div>
            </div>
            
            {/* Second row: $72K amount + Share button */}
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <CardTitle className="text-4xl font-bold text-gray-100">
                ${currentTVL >= 1000000 ? `${(currentTVL / 1000000).toFixed(1)}M` : currentTVL >= 1000 ? `${(currentTVL / 1000).toFixed(1)}K` : currentTVL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </CardTitle>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    {t('copyLink')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareToTwitter} className="cursor-pointer whitespace-nowrap">
                    <Image 
                      src="/x.png" 
                      alt="X (Twitter)"
                      width={16}
                      height={16}
                      className="mr-2"
                    />
                    {t('shareToTwitter')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Desktop layout */}
          <div className="hidden md:block md:mr-6">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <PieChart className="w-8 h-8 text-blue-500" />
                  {/* Show network icon only when connected to Arbitrum */}
                  {network === 'arbitrum' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                      <Image 
                        src="/networks/small/arbitrum.png" 
                        alt="Arbitrum"
                        width={16}
                        height={16}
                        className="rounded-full"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </div>
                  )}
                </div>
                <h3 className="text-3xl text-gray-100">{t('fund')} {fundId}</h3>
              </div>
            </div>
              
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <CardTitle className="text-4xl font-bold text-gray-100">
              ${currentTVL >= 1000000 ? `${(currentTVL / 1000000).toFixed(1)}M` : currentTVL >= 1000 ? `${(currentTVL / 1000).toFixed(1)}K` : currentTVL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </CardTitle>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    {t('copyLink')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareToTwitter} className="cursor-pointer whitespace-nowrap">
                    <Image 
                      src="/x.png" 
                      alt="X (Twitter)"
                      width={16}
                      height={16}
                      className="mr-2"
                    />
                    {t('shareToTwitter')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-0 md:mr-16 -ml-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 20, right: 10, left: 5, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state && typeof state.activeTooltipIndex === 'number' && state.activeTooltipIndex >= 0) {
                  setActiveIndexRewards(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setActiveIndexRewards(null)}
            >
              <defs>
                <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="tvlUSD" 
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#tvlGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
        
        {/* Interval selector - Below chart */}
        <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-20">
          <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setIntervalType('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                intervalType === 'daily' 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {t('daily')}
            </button>
            <button
              onClick={() => setIntervalType('weekly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                intervalType === 'weekly' 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {t('weekly')}
            </button>
          </div>
        </div>
        
        {/* Separator Bar - Below daily/weekly buttons, chart width */}
        <div className="pr-6 md:mr-12 -mr-4 mb-0 pt-2">
          <div className="border-t border-gray-600/50"></div>
        </div>
      </Card>

        {/* Mobile Float Buttons - Only visible on mobile */}
        {investButton && !isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4">
              {(() => {
                const buttons = [];
                
                // Connect Button (when wallet is not connected)
                if (!investButton.isConnected) {
                  buttons.push(
                    <Dialog key="connect-dialog" open={investButton.walletSelectOpen} onOpenChange={investButton.setWalletSelectOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          {investButton.t('connectWallet')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{investButton.t('connectWallet')}</DialogTitle>
                          <DialogDescription>
                            {investButton.t('chooseWalletToConnect')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Button
                            variant="outline"
                            onClick={() => investButton.handleConnectWallet()}
                            disabled={investButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {investButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/metamask.png" 
                                alt="MetaMask"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            MetaMask
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => investButton.handleConnectWallet()}
                            disabled={investButton.isConnecting}
                            className="w-full justify-start"
                          >
                            {investButton.isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Image 
                                src="/wallets/small/phantom.png" 
                                alt="Phantom"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                            )}
                            Phantom
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                  
                  // Return early if wallet is not connected
                  return buttons[0];
                }
                
                // Get Rewards Button
                if (investButton.isClient && investButton.shouldShowGetRewards) {
                  buttons.push(
                    <Button 
                      key="get-rewards"
                      variant="outline" 
                      size="lg" 
                      onClick={investButton.handleGetRewards}
                      disabled={investButton.isGettingRewards}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {investButton.isGettingRewards ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {investButton.t('claiming')}
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          {investButton.t('getRewards')}
                        </>
                      )}
                    </Button>
                  );
                }
                
                // My Account Button
                if (investButton.hasInvestedInFund) {
                  buttons.push(
                    <Button 
                      key="my-account"
                      variant="outline" 
                      size="lg" 
                      onClick={investButton.handleNavigateToAccount}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      <User className="mr-2 h-5 w-5" />
                      {investButton.t('myAccount')}
                    </Button>
                  );
                }
                
                // Invest Button
                if (!investButton.hasInvestedInFund && !investButton.isFundClosed) {
                  buttons.push(
                    <Button 
                      key="invest"
                      variant="outline" 
                      size="lg" 
                      onClick={investButton.handleInvestInFund} 
                      disabled={investButton.isJoining || investButton.isLoadingFund || !investButton.fundData?.fund}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {investButton.isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {investButton.t('investing')}
                        </>
                      ) : investButton.isLoadingFund || !investButton.fundData?.fund ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          {investButton.t('invest')}
                        </>
                      )}
                    </Button>
                  );
                }
                
                // Return the buttons with appropriate layout
                if (buttons.length === 1) {
                  return buttons[0];
                } else if (buttons.length === 2) {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {buttons.map(button => 
                        React.cloneElement(button, {
                          className: button.props.className.replace('w-full ', '')
                        })
                      )}
                    </div>
                  );
                } else {
                  return null;
                }
              })()}
            </div>
          </div>
        )}
    </div>
  )
} 