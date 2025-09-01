"use client"

import React, { useState, use, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ArrowLeft, BarChart3, Activity, Users, Loader2, Receipt, ArrowRight, ChevronDown, Calendar } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useFundInvestorData } from "../hooks/useFundInvestorData"
import { useFundData } from "../hooks/useFundData"
import { useFundTransactions } from "../hooks/useFundTransactions"
import { useFundSharePercentage } from "../hooks/useFundShare"
import { FundInvestorCharts } from "../components/FundInvestorCharts"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { FundErrorState } from "./components/FundErrorState"
import { FundActionTabs } from "./components/FundActionTabs"
import { PieChart } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useInvestableTokenPrices } from "@/app/hooks/useInvestableTokenPrices"
import { getTokenLogo } from "@/lib/utils"

interface FundInvestorPageProps {
  params: Promise<{
    network: string
    id: string
    walletAddress: string
  }>
}

interface RealTimePortfolio {
  totalValue: number
  tokensWithPrices: number
  totalTokens: number
  timestamp: number
  isJoined: boolean
}

export default function FundInvestorPage({ params }: FundInvestorPageProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const { network: routeNetwork, id: fundId, walletAddress } = use(params)
  const router = useRouter()
  
  // Use hooks
  const { address: connectedAddress, walletType, getProvider } = useWallet()
  const queryClient = useQueryClient()

  // Use URL network parameter instead of wallet network for subgraph
  const subgraphNetwork = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum'
  
  const { data: fundInvestorData, error: investorError, isLoading: isLoadingInvestor } = useFundInvestorData(fundId, walletAddress, subgraphNetwork as 'ethereum' | 'arbitrum')
  const { data: fundData } = useFundData(fundId, subgraphNetwork as 'ethereum' | 'arbitrum')
  const { data: fundTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useFundTransactions(fundId, walletAddress, subgraphNetwork as 'ethereum' | 'arbitrum')
  
  // Get actual fund share percentage
  const { sharePercentage, isLoading: isLoadingShare, fundShare, investorShare } = useFundSharePercentage(fundId, walletAddress, subgraphNetwork as 'ethereum' | 'arbitrum')
  
  // Fallback to USD calculation if share data not available
  const fallbackSharePercentage = (() => {
    if (!fundInvestorData?.investor || !fundData?.fund?.amountUSD) return 0
    const investorUSD = parseFloat(fundInvestorData.investor.amountUSD)
    const fundUSD = parseFloat(fundData.fund.amountUSD)
    return fundUSD > 0 ? (investorUSD / fundUSD) * 100 : 0
  })()
  
  const finalSharePercentage = sharePercentage > 0 ? sharePercentage : fallbackSharePercentage

  // State management
  const [activeTab, setActiveTab] = useState("portfolio")
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [isMounted, setIsMounted] = useState(false)
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1)

  // Helper functions for transaction formatting
  const formatRelativeTime = (timestamp: number) => {
    const now = new Date().getTime()
    const transactionTime = timestamp * 1000
    const diffInSeconds = Math.floor((now - transactionTime) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}${t('secondShort')}`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}${t('minuteShort')}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}${t('hourShort')}`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}${t('dayShort')}`
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `${weeks}${t('weekShort')}`
    } else {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months}${t('monthShort')}`
    }
  }

  const getTransactionTypeColor = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'deposit': 'text-green-400',
      'withdraw': 'text-red-400',
      'withdrawfee': 'text-orange-400',
      'depositfee': 'text-yellow-400',
      'swap': 'text-blue-400',
      'create': 'text-purple-400',
      'join': 'text-cyan-400',
      'default': 'text-gray-400'
    };
    return typeMap[type.toLowerCase()] || typeMap.default;
  }

  const getTransactionTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return t('deposit') || 'Deposit';
      case 'withdraw': 
        return t('withdraw') || 'Withdraw';
      case 'withdrawfee':
        return t('withdrawFee') || 'Withdraw Fee';
      case 'depositfee':
        return t('depositFee') || 'Deposit Fee';
      case 'swap':
        return t('swap') || 'Swap';
      case 'create':
        return t('create') || 'Create';
      case 'join':
        return t('join') || 'Join';
      default:
        return type;
    }
  }

  const formatUserAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get investor data if available
  const investor = fundInvestorData?.investor
  const isInvestor = !!investor
  
  // Get investable token prices for portfolio calculation
  const { data: tokensWithPrices } = useInvestableTokenPrices(subgraphNetwork as 'ethereum' | 'arbitrum')

  // Calculate portfolio data from investor tokens
  const portfolioData = useMemo(() => {
    if (!investor || !investor.tokensSymbols || !investor.tokensAmount || !tokensWithPrices) {
      return {
        tokens: [],
        totalValue: investor ? parseFloat(investor.amountUSD || '0') : 0,
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
      }
    }

    const tokens = investor.tokensSymbols.map((symbol, index) => {
      // tokensAmount is already formatted as BigDecimal from subgraph
      const actualAmount = parseFloat(investor.tokensAmount?.[index] || '0')
      
      // Find price from tokensWithPrices
      const tokenWithPrice = tokensWithPrices.find(t => t.symbol === symbol)
      const price = tokenWithPrice?.price || 0
      const value = actualAmount * price

      return {
        symbol,
        amount: actualAmount,
        value,
        price,
        percentage: 0 // Will be calculated after total
      }
    }).filter(token => token.amount > 0)

    // Use amountUSD from investor data directly for total value
    const totalValue = parseFloat(investor.amountUSD || '0')
    
    // Calculate sum of token values for percentage calculation
    const tokenValueSum = tokens.reduce((sum, token) => sum + token.value, 0)
    
    // Calculate percentages based on token value sum to ensure they add to 100%
    if (tokens.length === 1) {
      // If only one token, it should be 100%
      tokens[0].percentage = 100
    } else if (tokenValueSum > 0) {
      // Calculate percentages and ensure they sum to 100%
      let totalPercentage = 0
      tokens.forEach((token, index) => {
        if (index === tokens.length - 1) {
          // Last token gets the remainder to ensure exactly 100%
          token.percentage = 100 - totalPercentage
        } else {
          token.percentage = (token.value / tokenValueSum) * 100
          totalPercentage += token.percentage
        }
      })
    } else {
      // No value, all percentages are 0
      tokens.forEach(token => {
        token.percentage = 0
      })
    }

    // Sort by value descending
    tokens.sort((a, b) => b.value - a.value)

    return {
      tokens,
      totalValue,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
    }
  }, [investor, tokensWithPrices])

  // Calculate real-time portfolio value based on fund investor data
  const calculateRealTimePortfolioValue = useCallback((): RealTimePortfolio | null => {
    if (!fundInvestorData?.investor) {
      return null
    }
    
    const investor = fundInvestorData.investor
    const currentValue = parseFloat(investor.amountUSD) || 0
    const totalTokens = investor.tokensSymbols?.length || 0
    
    return {
      totalValue: currentValue,
      tokensWithPrices: totalTokens,
      totalTokens,
      timestamp: Date.now(),
      isJoined: true
    }
  }, [fundInvestorData])

  const realTimePortfolio = calculateRealTimePortfolioValue()

  // Set mounted state for Portal
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Ensure client-side rendering for time calculations
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update time every second for accurate countdown
  useEffect(() => {
    if (!isClient) return;

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [isClient]);
  
  // Check if the connected wallet is the fund manager
  const fundManager = fundData?.fund?.manager
  const isManagerFromFund = fundManager && connectedAddress?.toLowerCase() === fundManager.toLowerCase()
  
  // The user is a manager if they're marked as manager in investor data OR if they're the fund manager
  const isManager = investor?.isManager || isManagerFromFund || false
  
  // Determine if current connected wallet is viewing their own data
  const isViewingOwnData = connectedAddress?.toLowerCase() === walletAddress.toLowerCase()

  // Handle loading state with proper loading screen
  if (isLoadingInvestor) {
    return (
      <div className="container mx-auto p-6 py-20">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Go to Fund Button */}
          <div className="mb-4">
            <button 
              onClick={() => router.push(`/fund/${routeNetwork}/${fundId}`)}
              className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
              Go to Fund {fundId}
            </button>
          </div>
          
          {/* Loading Message for Investor Data */}
          <div className="text-center py-12">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg px-8 py-12 max-w-lg mx-auto">
              <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-blue-400" />
              <h3 className="text-xl font-medium text-blue-400 mb-4">Loading Investor Data</h3>
              <p className="text-gray-400 text-sm">
                Data update is in progress. This may take a few minutes.
              </p>
              
              {/* Show wallet address being loaded */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Investor</p>
                <p className="text-gray-200 font-mono text-base">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Loading Overlay */}
      {isRefreshing && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-16 h-16">
            <svg 
              className="w-16 h-16 animate-spin text-blue-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>,
        document.body
      )}

      <div className="container mx-auto p-2 sm:p-6 py-4 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-0">
          {/* Go to Fund Button */}
          <div className="px-2 sm:px-0">
          <button 
            onClick={() => router.push(`/fund/${routeNetwork}/${fundId}`)}
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Go to Fund {fundId}
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-12">
          {/* Left Side - Charts + Tabs */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-4">
            {/* Investor Charts */}
            {investor ? (
              <FundInvestorCharts 
                fundId={fundId}
                investor={walletAddress}
                network={subgraphNetwork as 'ethereum' | 'arbitrum'}
                isLoadingInvestor={isLoadingInvestor}
                intervalType={chartInterval}
              />
            ) : (
              <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">No Investment Data</h3>
                  <p className="text-sm">This address has not invested in this fund yet</p>
                </div>
              </div>
            )}
            
            {/* Interval selector - Below chart */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-8">
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Calendar className="h-4 w-4" />
                    {chartInterval === 'daily' ? t('daily') : chartInterval === 'weekly' ? t('weekly') : t('monthly')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32 bg-muted/80 border-gray-600 z-[60]">
                  <DropdownMenuItem onClick={() => setChartInterval('daily')}>
                    {t('daily')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartInterval('weekly')}>
                    {t('weekly')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartInterval('monthly')}>
                    {t('monthly')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Separator Bar - Below dropdown, chart width */}
            <div className="pr-6 md:mr-2 -mr-4 mb-4 pt-2">
              <div className="border-t border-gray-600/50"></div>
            </div>
              
            {/* Tabs section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 md:mr-8">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="portfolio" 
                    className="flex items-center gap-2 data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t('portfolio')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transactions" 
                    className="flex items-center gap-2 data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
                  >
                    <Activity className="h-4 w-4" />
                    {t('transactions')}
                  </TabsTrigger>
                </TabsList>
                  
                <TabsContent value="portfolio" className="space-y-4">
                  <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Portfolio
                    </h4>
                    
                    {portfolioData.tokens.length > 0 ? (
                      <>
                        {/* Pie Chart */}
                        <div className="flex items-center justify-center mb-6">
                          <div className="relative w-40 h-40">
                            {/* Dynamic CSS pie chart using conic-gradient */}
                            <div 
                              className="w-full h-full rounded-full"
                              style={{
                                background: `conic-gradient(
                                  from 0deg,
                                  ${(() => {
                                    let currentDegree = 0
                                    return portfolioData.tokens.map((token, index) => {
                                      const startDegree = currentDegree
                                      const endDegree = currentDegree + (token.percentage / 100) * 360
                                      currentDegree = endDegree
                                      const color = portfolioData.colors[index % portfolioData.colors.length]
                                      return `${color} ${startDegree}deg ${endDegree}deg`
                                    }).join(', ')
                                  })()}
                                )`
                              }}
                            />
                            {/* Center hole */}
                            <div className="absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">
                                  ${portfolioData.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-xs text-gray-400">Total Value</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-3">
                          {portfolioData.tokens.map((token, index) => (
                            <div key={token.symbol} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ 
                                    backgroundColor: portfolioData.colors[index % portfolioData.colors.length] 
                                  }}
                                ></div>
                                <span className="text-sm text-gray-300">{token.symbol}</span>
                                <span className="text-xs text-gray-500">
                                  ({token.amount < 0.0001 && token.amount > 0 
                                    ? '<0.0001' 
                                    : token.amount.toLocaleString(undefined, { 
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: token.amount < 1 ? 6 : 4 
                                      })})
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-white font-medium">
                                  {token.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-green-400">
                                  ${token.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : investor ? (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center mb-6">
                          <div className="relative w-40 h-40">
                            <div className="w-full h-full rounded-full bg-gray-800 border-2 border-gray-700"></div>
                            <div className="absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">
                                  ${portfolioData.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-xs text-gray-400">Total Value</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-400">No token holdings yet</p>
                        <p className="text-xs text-gray-500 mt-1">Portfolio composition will appear here</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No portfolio data available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-gray-400">{t('loadingTransactions')}</span>
                        </div>
                      ) : transactionsError ? (
                        <div className="text-center py-8 text-red-400">
                          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">Error loading transactions</p>
                          <p className="text-sm text-gray-400 mt-2">Please try again later</p>
                        </div>
                      ) : fundTransactions.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <div className="min-w-[500px]">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('time')}</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('type')}</th>
                                    <th className="text-left py-3 px-10 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                                    <th className="text-right py-3 px-20 sm:px-40 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    // Calculate pagination
                                    const itemsPerPage = 5;
                                    const maxPages = 5;
                                    const totalTransactions = Math.min(fundTransactions.length, maxPages * itemsPerPage);
                                    const startIndex = (currentTransactionPage - 1) * itemsPerPage;
                                    const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                                    const paginatedTransactions = fundTransactions.slice(startIndex, endIndex);

                                    return paginatedTransactions.map((transaction) => (
                                      <tr 
                                        key={transaction.id} 
                                        className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                        onClick={() => {
                                          const explorerUrl = subgraphNetwork === 'arbitrum' 
                                            ? `https://arbiscan.io/tx/${transaction.transactionHash}`
                                            : `https://etherscan.io/tx/${transaction.transactionHash}`
                                          window.open(explorerUrl, '_blank')
                                        }}
                                      >
                                        <td className="py-6 pl-6 pr-4">
                                          <div className="text-sm text-gray-400">
                                            {formatRelativeTime(transaction.timestamp)}
                                          </div>
                                        </td>
                                        <td className="py-6 px-4">
                                          <div className={`font-medium whitespace-nowrap ${getTransactionTypeColor(transaction.type)}`}>
                                            {getTransactionTypeText(transaction.type)}
                                          </div>
                                        </td>
                                        <td className="py-6 px-4">
                                          <div className="text-gray-300 text-sm">
                                            {formatUserAddress(walletAddress)}
                                          </div>
                                        </td>
                                        <td className="py-6 px-6">
                                          <div className="text-right">
                                            {transaction.type === 'Swap' || transaction.type === 'swap' ? (
                                              <div className="flex items-center gap-2 justify-end min-w-0 flex-wrap md:flex-nowrap">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                                    {transaction.amountIn}
                                                  </span>
                                                  <div className="relative flex-shrink-0">
                                                    {(() => {
                                                      const fromLogo = getTokenLogo(transaction.tokenIn || transaction.tokenInSymbol || '', subgraphNetwork as 'ethereum' | 'arbitrum')
                                                      return fromLogo ? (
                                                        <Image 
                                                          src={fromLogo} 
                                                          alt={transaction.tokenInSymbol || 'Token'}
                                                          width={20}
                                                          height={20}
                                                          className="rounded-full"
                                                        />
                                                      ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                          {transaction.tokenInSymbol?.slice(0, 1) || '?'}
                                                        </div>
                                                      )
                                                    })()}
                                                    {subgraphNetwork === 'arbitrum' && (
                                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                                        <Image 
                                                          src="/networks/small/arbitrum.png" 
                                                          alt="Arbitrum One"
                                                          width={10}
                                                          height={10}
                                                          className="rounded-full"
                                                          style={{ width: 'auto', height: 'auto' }}
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                                    {transaction.amountOut}
                                                  </span>
                                                  <div className="relative flex-shrink-0">
                                                    {(() => {
                                                      const toLogo = getTokenLogo(transaction.tokenOut || transaction.tokenOutSymbol || '', subgraphNetwork as 'ethereum' | 'arbitrum')
                                                      return toLogo ? (
                                                        <Image 
                                                          src={toLogo} 
                                                          alt={transaction.tokenOutSymbol || 'Token'}
                                                          width={20}
                                                          height={20}
                                                          className="rounded-full"
                                                        />
                                                      ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                                          {transaction.tokenOutSymbol?.slice(0, 1) || '?'}
                                                        </div>
                                                      )
                                                    })()}
                                                    {subgraphNetwork === 'arbitrum' && (
                                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                                        <Image 
                                                          src="/networks/small/arbitrum.png" 
                                                          alt="Arbitrum One"
                                                          width={10}
                                                          height={10}
                                                          className="rounded-full"
                                                          style={{ width: 'auto', height: 'auto' }}
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 justify-end">
                                                {(() => {
                                                  // Extract amount and token symbol from transaction data
                                                  let displayAmount = transaction.amount || '';
                                                  let tokenSymbol = transaction.symbol || '';
                                                  
                                                  // If amount includes token symbol, split them
                                                  if (displayAmount && displayAmount.includes(' ')) {
                                                    const parts = displayAmount.split(' ');
                                                    displayAmount = parts[0];
                                                    tokenSymbol = tokenSymbol || parts[1];
                                                  }
                                                  
                                                  // For deposit/withdraw, use the token field if available
                                                  const tokenAddress = transaction.token || tokenSymbol;
                                                  
                                                  return (
                                                    <>
                                                      <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                                        {displayAmount || transaction.details || '-'}
                                                      </span>
                                                      {tokenSymbol && (
                                                        <div className="relative flex-shrink-0">
                                                          {(() => {
                                                            const tokenLogo = getTokenLogo(tokenAddress || tokenSymbol, subgraphNetwork as 'ethereum' | 'arbitrum')
                                                            return tokenLogo ? (
                                                              <Image 
                                                                src={tokenLogo} 
                                                                alt={tokenSymbol}
                                                                width={20}
                                                                height={20}
                                                                className="rounded-full"
                                                              />
                                                            ) : (
                                                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                                {tokenSymbol.slice(0, 1)}
                                                              </div>
                                                            )
                                                          })()}
                                                          {subgraphNetwork === 'arbitrum' && (
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                                              <Image 
                                                                src="/networks/small/arbitrum.png" 
                                                                alt="Arbitrum One"
                                                                width={10}
                                                                height={10}
                                                                className="rounded-full"
                                                                style={{ width: 'auto', height: 'auto' }}
                                                              />
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Pagination */}
                          {(() => {
                            const itemsPerPage = 5;
                            const maxPages = 5;
                            const totalTransactions = Math.min(fundTransactions.length, maxPages * itemsPerPage);
                            const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);
                            
                            return totalPages > 1 && (
                              <div className="flex justify-center py-4 px-6 border-t border-gray-600">
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious 
                                        onClick={() => setCurrentTransactionPage(Math.max(1, currentTransactionPage - 1))}
                                        className={currentTransactionPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                                      />
                                    </PaginationItem>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <PaginationItem key={page}>
                                        <PaginationLink
                                          onClick={() => setCurrentTransactionPage(page)}
                                          isActive={currentTransactionPage === page}
                                          className="cursor-pointer hover:bg-gray-700"
                                        >
                                          {page}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}
                                    
                                    <PaginationItem>
                                      <PaginationNext 
                                        onClick={() => setCurrentTransactionPage(Math.min(totalPages, currentTransactionPage + 1))}
                                        className={currentTransactionPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions found for this investor</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Side - Investment Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-6 lg:mt-10 md:space-y-4">
                {/* Fund Action Tabs - Show based on user role (only for connected wallet viewing their own data) */}
                {isViewingOwnData && (
                  <FundActionTabs 
                    isManager={isManager}
                    isInvestor={isInvestor}
                    connectedAddress={connectedAddress}
                    fundId={fundId}
                    network={subgraphNetwork}
                  />
                )}
                
                {/* Investment Summary with loading skeleton */}
                <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                  {investor ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Fund ID</span>
                        <span className="text-sm text-white font-medium">#{fundId}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Network</span>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={subgraphNetwork === 'arbitrum' ? '/networks/small/arbitrum.png' : '/networks/small/ethereum.png'}
                            alt={subgraphNetwork}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span className="text-sm text-white font-medium capitalize">{subgraphNetwork}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Current Value</span>
                        <span className="text-sm text-white font-medium">
                          ${parseFloat(investor.amountUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Profit</span>
                        <span className={`text-sm font-medium ${parseFloat(investor.profitRatio || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {investor.profitRatio 
                            ? `${parseFloat(investor.profitRatio) >= 0 ? '+' : ''}${(parseFloat(investor.profitRatio) * 100).toFixed(2)}%`
                            : '0.00%'
                          }
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400">My Share</span>
                        <span className="text-sm text-white font-medium">
                          {finalSharePercentage.toFixed(2)}%
                        </span>
                      </div>
                      
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No investment data available</p>
                      <p className="text-xs mt-2">User has not invested in this fund yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 