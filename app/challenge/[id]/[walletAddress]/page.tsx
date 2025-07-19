"use client"


import React, { useState, use, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTokenLogo } from "@/lib/utils"
import {
  BarChart3,
  Wallet,
  Repeat,
  Activity,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Receipt,
  FileText,
  X
} from "lucide-react"
import { AssetSwap } from "@/components/asset-swap"
import { InvestorCharts } from "@/components/investor-charts"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useInvestorData } from "@/app/subgraph/Account"
import { useUserTokens } from "@/app/hooks/useUserTokens"
import { useUserTokenPrices } from "@/app/hooks/useUniswapBatchPrices"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useInvestorTransactions } from "@/app/hooks/useInvestorTransactions"
import { useRanking } from "@/app/hooks/useRanking"
import { useWallet } from "@/app/hooks/useWallet"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAppKitProvider } from '@reown/appkit/react'
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  getSteleContractAddress
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"

interface InvestorPageProps {
  params: Promise<{
    id: string
    walletAddress: string
  }>
}

export default function InvestorPage({ params }: InvestorPageProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const { id: challengeId, walletAddress } = use(params)
  const router = useRouter()
  
  // Use hooks
  const { address: connectedAddress, walletType, network, getProvider } = useWallet()
  

  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  const { data: investorData, isLoading: isLoadingInvestor, error: investorError } = useInvestorData(challengeId, walletAddress, subgraphNetwork)
  const { data: userTokens = [], isLoading: isLoadingTokens, error: tokensError } = useUserTokens(challengeId, walletAddress, subgraphNetwork)
  const { data: challengeData, isLoading: isLoadingChallenge, error: challengeError } = useChallenge(challengeId, subgraphNetwork)
  const { data: investorTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useInvestorTransactions(challengeId, walletAddress, subgraphNetwork)
  const { data: rankingData, isLoading: isLoadingRanking, error: rankingError } = useRanking(challengeId, subgraphNetwork)
  
  // Get real-time prices for user's tokens using Uniswap V3 onchain data - only if not closed
  const { data: uniswapPrices, isLoading: isLoadingUniswap, error: uniswapError } = useUserTokenPrices(
    investorData?.investor?.isRegistered === true ? [] : userTokens,
    subgraphNetwork
  )

  // Calculate real-time portfolio value - only if not closed
  const calculateRealTimePortfolioValue = useCallback(() => {
    // Don't calculate real-time portfolio if investor is closed
    if (investorData?.investor?.isRegistered === true) return null
    if (!uniswapPrices?.tokens || userTokens.length === 0) return null
    
    let totalValue = 0
    let tokensWithPrices = 0
    
    userTokens.forEach(token => {
      const tokenPrice = uniswapPrices.tokens[token.symbol]?.priceUSD
      if (tokenPrice && tokenPrice > 0) {
        const tokenAmount = parseFloat(token.amount) || 0
        totalValue += tokenPrice * tokenAmount
        tokensWithPrices++
      }
    })
    
    return {
      totalValue,
      tokensWithPrices,
      totalTokens: userTokens.length,
      timestamp: uniswapPrices.timestamp || Date.now()
    }
  }, [uniswapPrices, userTokens, investorData?.investor?.isRegistered])

  const realTimePortfolio = calculateRealTimePortfolioValue()

  const [activeTab, setActiveTab] = useState("portfolio")
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwapMode, setIsSwapMode] = useState(false)
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly'>('daily')
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Use React Query client for better data management
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [rankingCurrentPage, setRankingCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxPages = 5



  // Get swap details from transaction data
  const getSwapDetails = (transaction: any) => {
    if (transaction.type !== 'swap') return null
    
    // First try: Use the swap data from the transaction
    if (transaction.fromAssetSymbol && transaction.toAssetSymbol && transaction.fromAmount && transaction.toAmount) {
      const swapDetails = {
        fromAmount: parseFloat(transaction.fromAmount).toFixed(4),
        fromToken: transaction.fromAsset,
        fromTokenSymbol: transaction.fromAssetSymbol,
        toAmount: parseFloat(transaction.toAmount).toFixed(4),
        toToken: transaction.toAsset,
        toTokenSymbol: transaction.toAssetSymbol
      }
      return swapDetails
    }
    
    // Second try: Parse from details string (format: "USDC → ETH" or "ETH → USDC")
    if (transaction.details && transaction.amount) {
      const arrowPattern = /(\w+)\s*→\s*(\w+)/i
      const match = transaction.details.match(arrowPattern)
      
      if (match) {
        // Extract amount from transaction.amount field (format: "0.1000 ETH")
        const amountMatch = transaction.amount.match(/([\d.]+)\s+(\w+)/)
        
        const swapDetails = {
          fromAmount: amountMatch ? amountMatch[1] : '0',
          fromToken: match[1],
          toAmount: '0', // We don't have the toAmount in this format
          toToken: match[2]
        }
        return swapDetails
      }
    }
    
    return null
  }

  // Format relative time (1 day, 1 hour, 1 minute, 1 week, etc.)
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

  // Format token amount to limit decimal places for mobile display
  const formatTokenAmount = (amount: string) => {
    const num = parseFloat(amount)
    
    // If the number is 0 or invalid, return "0"
    if (isNaN(num) || num === 0) return "0"
    
    // For very small numbers (less than 0.00001), use scientific notation
    if (num < 0.00001 && num > 0) {
      return num.toExponential(2)
    }
    
    // For numbers >= 1000, show without decimals
    if (num >= 1000) {
      return num.toFixed(0)
    }
    
    // For numbers >= 1, limit to 5 decimal places maximum
    if (num >= 1) {
      return num.toFixed(5).replace(/\.?0+$/, '')
    }
    
    // For numbers < 1, show up to 5 decimal places, removing trailing zeros
    return num.toFixed(5).replace(/\.?0+$/, '')
  }

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'text-purple-400'
      case 'join':
        return 'text-blue-400'
      case 'swap':
        return 'text-green-400'
      case 'register':
        return 'text-orange-400'
      case 'reward':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  // Get transaction type display text
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'create':
        return t('create')
      case 'join':
        return t('join')
      case 'swap':
        return t('swap')
      case 'register':
        return t('register')
      case 'reward':
        return t('rewards')
      default:
        return type
    }
  }

  // Format user address
  const formatUserAddress = (address?: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return '';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get token explorer URL based on network
  const getTokenExplorerUrl = (tokenAddress: string) => {
    if (subgraphNetwork === 'arbitrum') {
      return `https://arbiscan.io/token/${tokenAddress}`
    }
    return `https://etherscan.io/token/${tokenAddress}`
  }

  // Handle token row click
  const handleTokenClick = (tokenAddress: string) => {
    window.open(getTokenExplorerUrl(tokenAddress), '_blank')
  }

  // Get wallet address explorer URL based on network
  const getWalletExplorerUrl = (walletAddress: string) => {
    if (subgraphNetwork === 'arbitrum') {
      return `https://arbiscan.io/address/${walletAddress}`
    }
    return `https://etherscan.io/address/${walletAddress}`
  }

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

  // Handle click outside to close mobile tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileTooltip) {
        setShowMobileTooltip(false);
        // Clear timer when closing tooltip
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          setTooltipTimer(null);
        }
      }
    };

    if (showMobileTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMobileTooltip, tooltipTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  // Handle loading and error states
  if (isLoadingInvestor || isLoadingChallenge || isLoadingTransactions) {
    return (
      <div className="container mx-auto p-6 py-20">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Back Button Loading */}
          <div className="mb-6">
            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          
          {/* Challenge Info Loading */}
          <div className="mb-0">
            <div className="flex items-center gap-3">
              <div className="h-8 bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
            </div>
          </div>
          
          {/* Header Loading */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-700 rounded w-40 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end gap-4">
                <div className="h-14 bg-gray-700 rounded-lg w-24 animate-pulse"></div>
                <div className="h-14 bg-gray-700 rounded-lg w-28 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading Message for New Investors */}
          {investorError && (
            <div className="text-center py-8">
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg px-6 py-8 max-w-md mx-auto">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-400" />
                <h3 className="text-lg font-medium text-blue-400 mb-2">{t('loadingInvestorData')}</h3>
                <p className="text-gray-400 text-xs">
                  {t('dataUpdateInProgress')}
                </p>
              </div>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Charts + Tabs */}
            <div className="lg:col-span-2 space-y-4">
              {/* Chart Loading */}
              <div className="h-80 bg-gray-700 rounded-lg animate-pulse"></div>
              
              {/* Tabs Loading */}
              <div className="space-y-4">
                <div className="flex w-full">
                  <div className="h-10 bg-gray-700 rounded-l w-1/2 animate-pulse"></div>
                  <div className="h-10 bg-gray-600 rounded-r w-1/2 animate-pulse"></div>
                </div>
                
                {/* Tab Content Loading */}
                <Card className="bg-transparent border border-gray-700/50">
                  <CardHeader>
                    <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Side - Portfolio Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Portfolio Summary Loading */}
                <Card className="bg-muted border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Row 1: Type and Status Loading */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Type Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                      
                      {/* Status Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse"></div>
                          <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Value Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Challenge Info Loading */}
                <Card className="bg-muted border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Row 1: Challenge and Seed Money Loading */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Challenge Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
                      </div>

                      {/* Seed Money Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Progress Loading */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                        <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 animate-pulse"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-700 rounded w-36 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle errors by showing loading UI instead of 404
  if (investorError || tokensError || challengeError || transactionsError || !investorData?.investor) {    
    return (
      <div className="container mx-auto p-6 py-20">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Go to Challenge Button */}
          <div className="mb-4">
            <button 
              onClick={() => router.push(`/challenge/${challengeId}`)}
              className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              {t('goToChallenge')} {challengeId}
            </button>
          </div>
          
          {/* Loading Message for New Investors */}
          <div className="text-center py-12">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg px-8 py-12 max-w-lg mx-auto">
              <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-blue-400" />
              <h3 className="text-xl font-medium text-blue-400 mb-4">{t('loadingInvestorData')}</h3>
              <p className="text-gray-400 text-sm">
                {t('dataUpdateInProgress')}
              </p>
              
              {/* Show wallet address being loaded */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">{t('investor')}</p>
                <p className="text-gray-200 font-mono text-base">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Skeleton Loading for Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Left Side - Charts + Tabs */}
            <div className="lg:col-span-2 space-y-4">
              {/* Chart Loading */}
              <div className="h-80 bg-gray-700 rounded-lg animate-pulse"></div>
              
              {/* Tabs Loading */}
              <div className="space-y-4">
                <div className="flex w-full">
                  <div className="h-10 bg-gray-700 rounded-l w-1/2 animate-pulse"></div>
                  <div className="h-10 bg-gray-600 rounded-r w-1/2 animate-pulse"></div>
                </div>
                
                {/* Tab Content Loading */}
                <Card className="bg-transparent border border-gray-700/50">
                  <CardHeader>
                    <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Side - Portfolio Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Portfolio Summary Loading */}
                <Card className="bg-muted border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Row 1: Type and Status Loading */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Type Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                      
                      {/* Status Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse"></div>
                          <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Value Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                    </div>


                  </CardContent>
                </Card>

                {/* Challenge Info Loading */}
                <Card className="bg-muted border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Row 1: Challenge and Seed Money Loading */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Challenge Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
                      </div>

                      {/* Seed Money Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Progress Loading */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                        <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 animate-pulse"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-700 rounded w-36 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const investor = investorData.investor



  // Calculate portfolio metrics using the actual data structure
  // USD values from subgraph are already in USD format, just parse as float
  const currentValue = parseFloat(investor.currentUSD) || 0
  const formattedSeedMoney = parseFloat(investor.seedMoneyUSD) || 0
  const gainLoss = currentValue - formattedSeedMoney
  const gainLossPercentage = formattedSeedMoney > 0 ? (gainLoss / formattedSeedMoney) * 100 : 0
  const isPositive = gainLoss >= 0

  // Get challenge details from real data
  const getChallengeDetails = () => {
    if (challengeData?.challenge) {
      const challenge = challengeData.challenge;
      return {
        participants: parseInt(challenge.investorCounter),
        prize: `$${(parseInt(challenge.rewardAmountUSD) / 1e18).toFixed(2)}`, // Convert from wei to USD
        entryFee: `$${(parseInt(challenge.entryFee) / 1e6).toFixed(2)}`, // USDC has 6 decimals
        seedMoney: `$${(parseInt(challenge.seedMoney) / 1e6).toFixed(2)}`, // USDC has 6 decimals
        isActive: challenge.isActive,
        startTime: new Date(parseInt(challenge.startTime) * 1000),
        endTime: new Date(parseInt(challenge.endTime) * 1000),
      };
    }
    
    return null;
  };

  const challengeDetails = getChallengeDetails();

  // Calculate time remaining from real challenge data
  const getTimeRemaining = () => {
    if (!isClient) {
      return { text: t('loading'), subText: "Calculating time..." };
    }
    
    if (challengeDetails) {
      const endTime = challengeDetails.endTime;
      const diff = endTime.getTime() - currentTime.getTime();
      
      if (diff <= 0) {
        return { text: t('ended'), subText: `Ended on ${endTime.toLocaleDateString()}` };
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      let timeText: string;
      if (days > 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        timeText = `${months} ${t('months')} ${remainingDays} ${t('days')}`;
      } else if (days > 0) {
        timeText = `${days} ${t('days')} ${hours} ${t('hours')}`;
      } else if (hours > 0) {
        timeText = `${hours} ${t('hours')} ${minutes} ${t('minutes')}`;
      } else if (minutes > 0) {
        timeText = `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}`;
      } else {
        timeText = `${seconds} ${t('seconds')}`;
      }
      
      return { 
        text: timeText, 
        subText: `Ends on ${endTime.toLocaleDateString()}` 
      };
    }
    
    // Fallback
    return { text: t('loading'), subText: "Calculating time..." };
  };

  const timeRemaining = getTimeRemaining();

  // Get appropriate explorer URL based on chain ID
  const getExplorerUrl = (chainId: string, txHash: string) => {
    switch (chainId) {
      case '0x1': // Ethereum Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case '0xa4b1': // Arbitrum One
        return `https://arbiscan.io/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`; // Default to Ethereum
    }
  };

  const getExplorerName = (chainId: string) => {
    switch (chainId) {
      case '0x1': // Ethereum Mainnet
        return 'Etherscan';
      case '0xa4b1': // Arbitrum One
        return 'Arbiscan';
      default:
        return 'Etherscan'; // Default to Ethereum
    }
  };

  // Handle Register function
  const handleRegister = async () => {
    setIsRegistering(true);
    
    try {
      // WalletConnect only - use getProvider from useWallet hook
      const provider = getProvider();
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.");
      }

      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet first.");
      }

      // Verify the connected wallet matches the investor address
      const connectedWalletAddress = accounts[0].toLowerCase();
      if (connectedWalletAddress !== walletAddress.toLowerCase()) {
        throw new Error(`Please connect with the correct wallet address: ${walletAddress}`);
      }

      // Get current network
      const chainId = await provider.send('eth_chainId', []);
      
      // Connect to provider with signer
      const signer = await provider.getSigner();
      
      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call register function with challengeId
      const tx = await steleContract.register(challengeId);
      
      // Show toast notification for transaction submitted
      const registerExplorerName = getExplorerName(chainId);
      const registerExplorerUrl = getExplorerUrl(chainId, tx.hash);
      
      toast({
        title: "Registration Submitted",
        description: "Your investor registration transaction has been sent to the network.",
        action: (
          <ToastAction altText={`View on ${registerExplorerName}`} onClick={() => window.open(registerExplorerUrl, '_blank')}>
            View on {registerExplorerName}
          </ToastAction>
        ),
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Show toast notification for transaction confirmed
      toast({
        title: "Registration Complete!",
        description: "Your investor information has been successfully registered!",
        action: (
          <ToastAction altText={`View on ${registerExplorerName}`} onClick={() => window.open(registerExplorerUrl, '_blank')}>
            View on {registerExplorerName}
          </ToastAction>
        ),
      });

      // Start refreshing process
      setIsRefreshing(true);

      // Refresh data after 3 seconds using React Query
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['challenge', challengeId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['transactions', challengeId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['ranking', challengeId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['investorData', challengeId, walletAddress, subgraphNetwork] });
        setIsRefreshing(false);
      }, 3000);
      
    } catch (error: any) {
      console.error("Error registering investor:", error);
      
      // Show toast notification for error
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unknown error occurred",
      });
      
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          {/* Simple Rotating Spinner */}
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
        </div>
      )}

      <div className="container mx-auto p-2 sm:p-6 py-4 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-0">
          {/* Go to Challenge Button */}
          <div className="px-2 sm:px-0">
          <button 
            onClick={() => router.push(`/challenge/${challengeId}`)}
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('goToChallenge')} {challengeId}
          </button>
        </div>
        
        {/* Header - Removed buttons as they are now in InvestorCharts */}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-12">
          {/* Left Side - Charts + Tabs */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-4">
            {/* Investor Charts */}
            <InvestorCharts 
              challengeId={challengeId} 
              investor={walletAddress} 
              network={subgraphNetwork}
              investorData={investorData}
              realTimePortfolio={realTimePortfolio}
              interval={chartInterval}
            />
            
            {/* Interval selector */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-8 pb-2">
              <div className="inline-flex bg-gray-800/60 p-1 rounded-full border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setChartInterval('daily')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    chartInterval === 'daily' 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('daily')}
                </button>
                <button
                  onClick={() => setChartInterval('weekly')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out ${
                    chartInterval === 'weekly' 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {t('weekly')}
                </button>
              </div>
            </div>
            
            {/* Separator Bar */}
            <div className="border-t border-gray-600/50 mx-2 sm:mx-0 md:mr-8 pb-2"></div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 md:mr-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="portfolio" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('portfolio')}
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('transactions')}
                </TabsTrigger>
                <TabsTrigger value="ranking" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {t('ranking')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio" className="space-y-4">
                <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      {userTokens.length > 0 ? (
                        <table className="w-full min-w-[300px]">
                          <thead>
                            <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                              <th className="text-left py-3 pl-10 md:pl-14 sm:pl-6 pr-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('token')}</th>
                              <th className="text-right py-3 pr-10 md:pr-10 sm:pr-6 px-4 sm:px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('amount')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userTokens.map((token, index) => {
                              // Get price from Uniswap data
                              const tokenPrice = uniswapPrices?.tokens?.[token.symbol]?.priceUSD || 0
                              const isLoadingPrice = isLoadingUniswap
                              const hasValidPrice = tokenPrice > 0
                              const tokenAmount = parseFloat(token.amount) || 0
                              const tokenValue = hasValidPrice ? tokenPrice * tokenAmount : 0
                              
                              return (
                                <tr 
                                  key={index} 
                                  className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                  onClick={() => handleTokenClick(token.address)}
                                >
                                  <td className="py-6 pl-4 sm:pl-6 pr-4">
                                    <div className="flex items-center gap-3">
                                      <div className="relative flex-shrink-0">
                                      {(() => {
                                        const logoPath = getTokenLogo(token.address, subgraphNetwork)
                                        
                                        if (logoPath) {
                                          return (
                                            <img
                                              src={logoPath}
                                              alt={token.symbol}
                                              className="h-10 w-10 rounded-full object-cover"
                                              onError={(e: any) => {
                                                console.error('Failed to load token logo:', logoPath)
                                                const target = e.target as HTMLImageElement
                                                target.outerHTML = `
                                                  <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    ${token.symbol.slice(0, 2)}
                                                  </div>
                                                `
                                              }}
                                            />
                                          )
                                        } else {
                                          return (
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                              {token.symbol.slice(0, 2)}
                                            </div>
                                          )
                                        }
                                      })()}
                                        {/* Show Arbitrum network icon only when connected to Arbitrum */}
                                        {subgraphNetwork === 'arbitrum' && (
                                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                            <Image 
                                              src="/networks/small/arbitrum.png" 
                                              alt="Arbitrum One"
                                              width={14}
                                              height={14}
                                              className="rounded-full"
                                              style={{ width: '14px', height: '14px' }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-100">{token.symbol}</p>
                                        <p className="text-sm text-gray-400">{token.address.slice(0, 8)}...{token.address.slice(-6)}</p>
                                        {/* Show real-time price */}
                                        {isLoadingPrice ? (
                                          <p className="text-xs text-gray-500">{t('loadingPrice')}</p>
                                        ) : tokenPrice > 0 ? (
                                          <p className="text-xs text-green-400">${tokenPrice.toFixed(4)} {t('perToken')}</p>
                                        ) : (
                                          <p className="text-xs text-gray-500">{t('priceUnavailable')}</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4 sm:px-6">
                                    <div className="text-right">
                                      <p className="font-medium text-gray-100">{formatTokenAmount(token.amount)}</p>
                                      {/* Show USD value */}
                                      {isLoadingPrice ? (
                                        <p className="text-sm text-gray-500">{t('loading')}</p>
                                      ) : tokenValue > 0 ? (
                                        <p className="text-sm text-green-400">${tokenValue.toFixed(2)}</p>
                                      ) : (
                                        <p className="text-sm text-gray-500">$0.00</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{t('noTokensFound')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

                            <TabsContent value="transactions" className="space-y-4">
                <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    {isLoadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2 text-gray-400">{t('loadingTransactions')}</span>
                      </div>
                    ) : transactionsError ? (
                      <div className="text-center py-8 text-red-400">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">{t('errorLoadingTransactions')}</p>
                        <p className="text-sm text-gray-400 mt-2">Please try again later</p>
                      </div>
                    ) : investorTransactions.length > 0 ? (
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
                                const totalTransactions = Math.min(investorTransactions.length, maxPages * itemsPerPage);
                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                                const paginatedTransactions = investorTransactions.slice(startIndex, endIndex);

                                return paginatedTransactions.map((transaction) => (
                              <tr 
                                key={transaction.id} 
                                className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                onClick={() => {
                                  const chainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
                                  window.open(getExplorerUrl(chainId, transaction.transactionHash), '_blank');
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
                                    {transaction.type === 'reward' ? formatUserAddress(transaction.user) : formatUserAddress(walletAddress)}
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="text-right">
                                  {transaction.type === 'swap' ? (
                                    (() => {
                                      const swapDetails = getSwapDetails(transaction)
                                      if (swapDetails) {
                                        const fromLogo = getTokenLogo(swapDetails.fromToken, subgraphNetwork)
                                        const toLogo = getTokenLogo(swapDetails.toToken, subgraphNetwork)
                                        return (
                                          <div className="flex items-center gap-2 justify-end min-w-0 flex-wrap md:flex-nowrap">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="relative flex-shrink-0">
                                              {fromLogo ? (
                                                <Image 
                                                  src={fromLogo} 
                                                  alt={(swapDetails as any).fromTokenSymbol || swapDetails.fromToken || 'Token'}
                                                  width={20}
                                                  height={20}
                                                  className="rounded-full"
                                                />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                                  {((swapDetails as any).fromTokenSymbol || swapDetails.fromToken)?.slice(0, 1) || '?'}
                                                </div>
                                              )}
                                                {/* Show Arbitrum network icon only when connected to Arbitrum */}
                                                {subgraphNetwork === 'arbitrum' && (
                                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                                    <Image 
                                                      src="/networks/small/arbitrum.png" 
                                                      alt="Arbitrum One"
                                                      width={10}
                                                      height={10}
                                                      className="rounded-full"
                                                      style={{ width: '10px', height: '10px' }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.fromAmount} {(swapDetails as any).fromTokenSymbol || swapDetails.fromToken}</span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="relative flex-shrink-0">
                                              {toLogo ? (
                                                <Image 
                                                  src={toLogo} 
                                                  alt={(swapDetails as any).toTokenSymbol || swapDetails.toToken || 'Token'}
                                                  width={20}
                                                  height={20}
                                                  className="rounded-full"
                                                />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                                  {((swapDetails as any).toTokenSymbol || swapDetails.toToken)?.slice(0, 1) || '?'}
                                                </div>
                                              )}
                                                {/* Show Arbitrum network icon only when connected to Arbitrum */}
                                                {subgraphNetwork === 'arbitrum' && (
                                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                                    <Image 
                                                      src="/networks/small/arbitrum.png" 
                                                      alt="Arbitrum One"
                                                      width={10}
                                                      height={10}
                                                      className="rounded-full"
                                                      style={{ width: '10px', height: '10px' }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.toAmount && swapDetails.toAmount !== '0' ? `${swapDetails.toAmount} ` : ''}{(swapDetails as any).toTokenSymbol || swapDetails.toToken}</span>
                                            </div>
                                          </div>
                                        )
                                      }
                                      return <p className="text-sm md:text-base font-medium text-gray-100 truncate">{transaction.amount || '-'}</p>
                                    })()
                                  ) : transaction.type === 'join' || transaction.type === 'register' ? (
                                    <p className="text-sm md:text-base font-medium text-gray-100 truncate">{formatUserAddress(transaction.user)}</p>
                                  ) : (
                                    <p className="font-medium text-gray-100 truncate">{transaction.amount || '-'}</p>
                                  )}
                                  </div>
                                </td>
                              </tr>
                            ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Pagination - outside scrollable area, fixed at bottom */}
                      {(() => {
                        const totalTransactions = Math.min(investorTransactions.length, maxPages * itemsPerPage);
                        const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);
                        
                        return totalPages > 1 && (
                          <div className="flex justify-center py-4 px-6 border-t border-gray-600">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                                  />
                                </PaginationItem>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={currentPage === page}
                                      className="cursor-pointer hover:bg-gray-700"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
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
                        <p className="text-sm mt-2">Transaction history will appear here once you start trading</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ranking" className="space-y-4">
                <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      {isLoadingRanking ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2 text-gray-400">Loading rankings...</span>
                        </div>
                      ) : rankingError ? (
                        <div className="text-center py-8 text-red-400">
                          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">Error loading rankings</p>
                          <p className="text-sm text-gray-400 mt-2">Please try again later</p>
                        </div>
                      ) : rankingData && rankingData.topUsers.length > 0 ? (
                        (() => {
                          // Calculate pagination for ranking
                          const totalRankingUsers = Math.min(rankingData.topUsers.length, maxPages * itemsPerPage);
                          const rankingStartIndex = (rankingCurrentPage - 1) * itemsPerPage;
                          const rankingEndIndex = Math.min(rankingStartIndex + itemsPerPage, totalRankingUsers);
                          const paginatedUsers = rankingData.topUsers.slice(rankingStartIndex, rankingEndIndex);
                          const rankingTotalPages = Math.min(Math.ceil(totalRankingUsers / itemsPerPage), maxPages);

                          return (
                            <>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[80px]">{t('rank')}</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[120px]">{t('user')}</th>
                                    <th className="text-right py-3 px-10 sm:px-10 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[120px]">{t('profitRatio')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paginatedUsers.map((user, paginatedIndex) => {
                                    const actualIndex = rankingStartIndex + paginatedIndex;
                                    const rank = actualIndex + 1;
                                    const score = rankingData.scores[actualIndex];
                                    const profitRatio = rankingData.profitRatios[actualIndex];
                              
                              // Format address
                              const formatAddress = (address: string) => {
                                if (!address || address === '0x0000000000000000000000000000000000000000') {
                                  return '';
                                }
                                return `${address.slice(0, 6)}...${address.slice(-4)}`;
                              };
                              
                              // Format score (USDC value)
                              const formatScore = (score: string) => {
                                try {
                                  const scoreValue = parseFloat(score);
                                  return `$${scoreValue.toFixed(2)}`;
                                } catch {
                                  return '$0.00';
                                }
                              };
                              
                              // Format profit ratio
                              const formatProfitRatio = (profitRatio: string) => {
                                try {
                                  const ratioValue = parseFloat(profitRatio);
                                  return `${ratioValue >= 0 ? '+' : ''}${ratioValue.toFixed(2)}%`;
                                } catch {
                                  return '0.00%';
                                }
                              };
                              
                              // Get rank icon
                              const getRankIcon = (rank: number) => {
                                switch (rank) {
                                  case 1:
                                    return '🥇';
                                  case 2:
                                    return '🥈';
                                  case 3:
                                    return '🥉';
                                  case 4:
                                    return '🏅';
                                  case 5:
                                    return '🎖️';
                                  default:
                                    return rank.toString();
                                }
                              };

                              // Handle user click
                              const handleUserClick = (userAddress: string) => {
                                // Check if address is empty or zero address
                                if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
                                  return;
                                }
                                router.push(`/challenge/${challengeId}/${userAddress}`);
                              };
                              
                              const formattedAddress = formatAddress(user);
                              const isEmptySlot = !formattedAddress;
                              const isCurrentUser = walletAddress && user.toLowerCase() === walletAddress.toLowerCase();

                              return (
                                <tr 
                                  key={`${user}-${rank}`} 
                                  className={`hover:bg-gray-800/30 transition-colors ${isCurrentUser ? 'ring-2 ring-blue-500/50' : ''} ${
                                    isEmptySlot ? 'cursor-default' : 'cursor-pointer'
                                  }`}
                                  onClick={() => !isEmptySlot && handleUserClick(user)}
                                >
                                  <td className="py-6 pl-6 pr-4">
                                    <div className="flex items-center justify-center w-10 h-10">
                                      {rank <= 5 ? (
                                        <span className="text-3xl">{getRankIcon(rank)}</span>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                          <span className="text-sm font-bold text-white">{rank}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="font-medium flex items-center gap-2">
                                      {isEmptySlot ? (
                                        <span className="text-gray-500 italic">Empty Slot</span>
                                      ) : (
                                        <>
                                          <span className="text-gray-300">{formattedAddress}</span>
                                          {isCurrentUser && (
                                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                                              You
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-6 px-6">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-white">{formatScore(score)}</div>
                                      <div className={`text-sm ${parseFloat(profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatProfitRatio(profitRatio)}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                                </tbody>
                              </table>
                              
                              {/* Pagination for Ranking */}
                              {rankingTotalPages > 1 && (
                                <div className="flex justify-center mt-2">
                                  <Pagination>
                                    <PaginationContent>
                                      <PaginationItem>
                                        <PaginationPrevious 
                                          onClick={() => setRankingCurrentPage(Math.max(1, rankingCurrentPage - 1))}
                                          className={rankingCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                      </PaginationItem>
                                      
                                      {Array.from({ length: rankingTotalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            onClick={() => setRankingCurrentPage(page)}
                                            isActive={rankingCurrentPage === page}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      ))}
                                      
                                      <PaginationItem>
                                        <PaginationNext 
                                          onClick={() => setRankingCurrentPage(Math.min(rankingTotalPages, rankingCurrentPage + 1))}
                                          className={rankingCurrentPage === rankingTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                      </PaginationItem>
                                    </PaginationContent>
                                  </Pagination>
                                </div>
                              )}
                            </>
                          )
                        })()
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No ranking data found</p>
                          <p className="text-sm mt-1">Rankings will appear once users register for the challenge</p>
                        </div>
                      )}
                      
                      {rankingData && (
                        <div className="border-t border-gray-700">
                          <div className="mt-2 mb-2 text-xs text-gray-500 text-center">
                            Last updated: {new Date(parseInt(rankingData.updatedAtTimestamp) * 1000).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Side - Portfolio Summary / Swap Assets */}
          <div className="lg:col-span-1">
            <div className="space-y-6 lg:mt-10 md:space-y-4">
              {/* Investor Info Section */}
              <div className="flex items-center justify-between gap-4 mb-4">
                                 {/* Action Buttons and Registered status */}
                 <div className="w-full">
                   {/* Action buttons (Swap, Register) - Hidden on mobile, shown on desktop */}
                   {connectedAddress && walletAddress && 
                    connectedAddress.toLowerCase() === walletAddress.toLowerCase() && 
                    investorData?.investor?.isRegistered !== true && (
                     <div className="hidden md:flex gap-3 w-full">
                       <Button 
                         variant="outline" 
                         size="lg" 
                         onClick={() => setIsSwapMode(!isSwapMode)}
                         className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                       >
                         {isSwapMode ? (
                           <>
                             <X className="mr-2 h-5 w-5" />
                             {t('close')}
                           </>
                         ) : (
                           <>
                             <Repeat className="mr-2 h-5 w-5" />
                             {t('swap')}
                           </>
                         )}
                       </Button>
                       <Button 
                         variant="default" 
                         size="lg" 
                         onClick={handleRegister}
                         disabled={isRegistering}
                         className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                       >
                         {isRegistering ? (
                           <>
                             <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                             {t('registering')}
                           </>
                         ) : (
                           <>
                             <FileText className="mr-2 h-5 w-5" />
                             {t('register')}
                           </>
                         )}
                       </Button>
                     </div>
                                      )}
                   
                   {/* Desktop Registered status - Show on desktop, hide on mobile */}
                   {investorData?.investor?.isRegistered === true && (
                     <div className="hidden md:block w-full bg-green-900/30 border border-green-500/50 rounded-lg px-6 py-3">
                       <div className="flex items-center justify-center gap-2">
                         <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-green-400 font-medium text-base">{t('registered')}</span>
                       </div>
                     </div>
                   )}
                 </div>
              </div>
              
              {/* Swap Assets (when swap mode is active) */}
              {/* Desktop version - static position */}
              {isSwapMode && (
                <div className="hidden md:block">
                  <AssetSwap userTokens={userTokens} />
                </div>
              )}
              
              {/* Mobile version - floating */}
              {isSwapMode && (
                <div className="fixed inset-0 z-50 md:hidden">
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSwapMode(false)} />
                  <div className="fixed inset-0 flex items-center justify-center p-4" onClick={() => setIsSwapMode(false)}>
                    <div className="w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-muted rounded-2xl p-6 shadow-2xl">
                        <AssetSwap userTokens={userTokens} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Portfolio Summary (always visible) */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Type and Status */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Type */}
                    <div className="space-y-2">
                      <span className="text-base text-gray-400">{t('type')}</span>
                      <div className="text-3xl text-white">
                        {(() => {
                          const challengeType = challengeData?.challenge?.challengeType
                          switch (challengeType) {
                            case 0:
                              return t('oneWeek');
                            case 1:
                              return t('oneMonth');
                            case 2:
                              return t('threeMonths');
                            case 3:
                              return t('sixMonths');
                            case 4:
                              return t('oneYear');
                            default:
                              return challengeType !== undefined ? `Type ${challengeType}` : `Type ${challengeId}`;
                          }
                        })()}
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="space-y-2">
                      <span className="text-base text-gray-400">{t('status')}</span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          // Always show network icon regardless of status
                          const networkIcon = network === 'ethereum' ? (
                            <Image 
                              src="/networks/small/ethereum.png" 
                              alt="Ethereum Mainnet"
                              width={24}
                              height={24}
                              className="rounded-full"
                              style={{ width: '24px', height: '24px' }}
                            />
                          ) : network === 'arbitrum' ? (
                            <Image 
                              src="/networks/small/arbitrum.png" 
                              alt="Arbitrum One"
                              width={24}
                              height={24}
                              className="rounded-full"
                              style={{ width: '24px', height: '24px' }}
                            />
                          ) : (
                            // Default to Ethereum icon if network is not recognized
                            <Image 
                              src="/networks/small/ethereum.png" 
                              alt="Ethereum Mainnet"
                              width={24}
                              height={24}
                              className="rounded-full"
                              style={{ width: '24px', height: '24px' }}
                            />
                          );

                          // If investor is closed, show as Finished
                          if (investorData?.investor?.isRegistered === true) {
                            return (
                              <>
                                <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                                  {networkIcon}
                                </div>
                                <span className="text-xl text-red-400">{t('finished')}</span>
                              </>
                            )
                          }
                          // Otherwise show challenge active status
                          const isActive = challengeData?.challenge?.isActive
                          return (
                            <>
                              <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                                {networkIcon}
                              </div>
                              <span className={`text-xl ${isActive ? 'text-green-400' : 'text-orange-400'}`}>
                                {isActive ? t('active') : 'Pending reward'}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Value */}
                  <div className="space-y-2">
                    <span className="text-base text-gray-400">{t('onChainValue')}</span>
                    <div className="flex items-baseline gap-1">
                      <div className="text-4xl text-white">
                        ${currentValue.toFixed(2)}
                      </div>
                      <div className={`text-base ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        ({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                      </div>
                    </div>
                    {/* Real-time portfolio value */}
                    {realTimePortfolio && (
                      <div className="space-y-1">
                        {(() => {
                          const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                          const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                          const isRealTimePositive = realTimeGainLoss >= 0
                          
                          return (
                            <div className={`text-base flex items-center gap-2 ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}>
                              <span className="w-3 h-3 bg-current rounded-full animate-pulse"></span>
                              {t('live')}: ${realTimePortfolio.totalValue.toFixed(2)} ({isRealTimePositive ? '+' : ''}{realTimeGainLossPercentage.toFixed(2)}%)
                            </div>
                          )
                        })()}
                      </div>
                    )}
                    {isLoadingUniswap && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        {t('loadingLivePrices')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Info */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Challenge ID and Seed Money */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Challenge ID */}
                    <div className="space-y-2">
                      <span className="text-base text-gray-400">{t('challenge')}</span>
                      <div className="text-3xl text-white">
                        {challengeId}
                      </div>
                    </div>

                    {/* Seed Money */}
                    <div className="space-y-2">
                      <span className="text-base text-gray-400">{t('seedMoney')}</span>
                      <div className="text-3xl text-white">
                        {(() => {
                          // If we have challenge data and seedMoney is available
                          if (challengeData?.challenge?.seedMoney) {
                            const seedMoneyValue = parseInt(challengeData.challenge.seedMoney);
                            return seedMoneyValue > 0 ? `$${seedMoneyValue}` : '$0';
                          }
                          // Default fallback
                          return '$0';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-400">{t('progress')}</span>
                      <span className="text-base font-medium text-gray-300">
                        {(() => {
                          if (!challengeDetails || !isClient) return '0%';
                          
                          const startTime = challengeDetails.startTime.getTime();
                          const endTime = challengeDetails.endTime.getTime();
                          const now = currentTime.getTime();
                          
                          if (now < startTime) return '0%';
                          if (now >= endTime) return '100%';
                          
                          const totalDuration = endTime - startTime;
                          const elapsed = now - startTime;
                          const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                          
                          return `${progress.toFixed(0)}%`;
                        })()}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <TooltipProvider>
                        <Tooltip open={showMobileTooltip}>
                          <TooltipTrigger asChild>
                            <div 
                              className="w-full bg-gray-700 rounded-full h-3 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                // Clear existing timer
                                if (tooltipTimer) {
                                  clearTimeout(tooltipTimer);
                                  setTooltipTimer(null);
                                }
                                
                                if (!showMobileTooltip) {
                                  // Show tooltip
                                  setShowMobileTooltip(true);
                                  
                                  // Auto-close after 4 seconds on mobile
                                  if (!window.matchMedia('(hover: hover)').matches) {
                                    const timer = setTimeout(() => {
                                      setShowMobileTooltip(false);
                                      setTooltipTimer(null);
                                    }, 4000);
                                    setTooltipTimer(timer);
                                  }
                                } else {
                                  // Hide tooltip
                                  setShowMobileTooltip(false);
                                }
                              }}
                              onMouseEnter={() => {
                                // Only trigger on desktop (devices with hover capability)
                                if (window.matchMedia('(hover: hover)').matches) {
                                  setShowMobileTooltip(true);
                                }
                              }}
                              onMouseLeave={() => {
                                // Only trigger on desktop (devices with hover capability)
                                if (window.matchMedia('(hover: hover)').matches) {
                                  setShowMobileTooltip(false);
                                }
                              }}
                            >
                              <div 
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ 
                                  width: `${(() => {
                                    if (!challengeDetails || !isClient) return 0;
                                    
                                    const startTime = challengeDetails.startTime.getTime();
                                    const endTime = challengeDetails.endTime.getTime();
                                    const now = currentTime.getTime();
                                    
                                    if (now < startTime) return 0;
                                    if (now >= endTime) return 100;
                                    
                                    const totalDuration = endTime - startTime;
                                    const elapsed = now - startTime;
                                    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                                    
                                    return progress;
                                  })()}%` 
                                }}
                              ></div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm font-medium">{timeRemaining.text}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Time Info */}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('start')}: {challengeDetails?.startTime.toLocaleDateString() || 'N/A'}</span>
                      <span>End: {challengeDetails?.endTime.toLocaleDateString() || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Float Buttons - Only visible on mobile */}
        {connectedAddress && walletAddress && 
          connectedAddress.toLowerCase() === walletAddress.toLowerCase() && 
          investorData?.investor?.isRegistered !== true && 
          !isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4">
              {(() => {
                const buttons = [];
                
                // Swap Button
                buttons.push(
                  <Button 
                    key="swap"
                    variant="outline" 
                    size="lg" 
                    onClick={() => setIsSwapMode(!isSwapMode)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                  >
                    {isSwapMode ? (
                      <>
                        <X className="mr-2 h-5 w-5" />
                        {t('close')}
                      </>
                    ) : (
                      <>
                        <Repeat className="mr-2 h-5 w-5" />
                        {t('swap')}
                      </>
                    )}
                  </Button>
                );
                
                // Register Button
                buttons.push(
                  <Button 
                    key="register"
                    variant="default" 
                    size="lg" 
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('registering')}
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        {t('register')}
                      </>
                    )}
                  </Button>
                );
                
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
    </div>
    </>
  )
} 