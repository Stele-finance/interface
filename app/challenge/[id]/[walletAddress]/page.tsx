"use client"


import { useState, useMemo, use, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, getTokenLogo } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Clock, 
  CheckCircle2,
  XCircle,
  Star,
  BarChart3,
  Wallet,
  Repeat,
  Activity,
  User,
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
import { useInvestorData } from "@/app/subgraph/Account"
import { useUserTokens } from "@/app/hooks/useUserTokens"
import { useUserTokenPrices } from "@/app/hooks/useUniswapBatchPrices"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useInvestorTransactions } from "@/app/hooks/useInvestorTransactions"
import { useRanking } from "@/app/hooks/useRanking"
import { useWallet } from "@/app/hooks/useWallet"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { 
  ETHEREUM_CHAIN_ID, 
  ETHEREUM_CHAIN_CONFIG, 
  USDC_DECIMALS,
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
  const { id: challengeId, walletAddress } = use(params)
  const router = useRouter()
  
  // Use hooks
  const { address: connectedAddress, isConnected, walletType, network } = useWallet()
  
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

  // Handle wallet address click
  const handleWalletClick = () => {
    window.open(getWalletExplorerUrl(walletAddress), '_blank')
  }

  // Ensure client-side rendering for time calculations
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update time every second for accurate countdown
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

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
                <Card className="bg-gray-900 border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
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

                    {/* Portfolio Value Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                    </div>

                    {/* Gain/Loss Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-44 animate-pulse"></div>
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>

                    {/* Status Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse"></div>
                        <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Challenge Info Loading */}
                <Card className="bg-gray-900 border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Challenge Type Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>

                    {/* Challenge ID Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
                    </div>

                    {/* Seed Money Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
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
                <Card className="bg-gray-900 border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Portfolio Value Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                    </div>

                    {/* Gain/Loss Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-10 bg-gray-700 rounded w-44 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Challenge Info Loading */}
                <Card className="bg-gray-900 border-0 rounded-2xl">
                  <CardContent className="p-8 space-y-8">
                    {/* Challenge Type Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-32 animate-pulse"></div>
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

  // Simple challenge progress based on profit
  const challengeProgress = isClient ? Math.min(Math.max(gainLossPercentage, 0), 100) : 0;

  // Get challenge title from real data
  const getChallengeTitle = () => {
    if (challengeData?.challenge) {
      const challengeType = challengeData.challenge.challengeType;
      switch(challengeType) {
        case 0:
          return 'One Week Challenge';
        case 1:
          return 'One Month Challenge';
        case 2:
          return 'Three Month Challenge';
        case 3:
          return 'Six Month Challenge';
        case 4:
          return 'One Year Challenge';
        default:
          return `Challenge Type ${challengeType}`;
      }
    }
    
    // Fallback logic using challengeId
    switch(challengeId) {
      case '1':
        return 'One Week Challenge';
      case '2':
        return 'One Month Challenge';
      case '3':
        return 'Three Month Challenge';
      case '4':
        return 'Six Month Challenge';
      case '5':
        return 'One Year Challenge';
      default:
        return 'Challenge';
    }
  }

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
      case '0x2105': // Base Mainnet
        return `https://basescan.org/tx/${txHash}`;
      case '0x89': // Polygon
        return `https://polygonscan.com/tx/${txHash}`;
      case '0xa': // Optimism
        return `https://optimistic.etherscan.io/tx/${txHash}`;
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
      case '0x2105': // Base Mainnet
        return 'BaseScan';
      case '0x89': // Polygon
        return 'PolygonScan';
      case '0xa': // Optimism
        return 'Optimistic Etherscan';
      case '0xa4b1': // Arbitrum One
        return 'Arbiscan';
      default:
        return 'Block Explorer';
    }
  };

  // Handle Register function
  const handleRegister = async () => {
    setIsRegistering(true);
    
    try {
      let walletProvider;
      
      // Get the appropriate wallet provider based on connected wallet type
      if (walletType === 'metamask') {
        if (typeof (window as any).ethereum === 'undefined') {
          throw new Error("MetaMask is not installed. Please install it from https://metamask.io/");
        }
        
        // For MetaMask, find the correct provider
        if ((window as any).ethereum.providers) {
          walletProvider = (window as any).ethereum.providers.find((provider: any) => provider.isMetaMask);
        } else if ((window as any).ethereum.isMetaMask) {
          walletProvider = (window as any).ethereum;
        }
        
        if (!walletProvider) {
          throw new Error("MetaMask provider not found");
        }
      } else if (walletType === 'phantom') {
        if (typeof window.phantom === 'undefined') {
          throw new Error("Phantom wallet is not installed. Please install it from https://phantom.app/");
        }

        if (!window.phantom?.ethereum) {
          throw new Error("Ethereum provider not found in Phantom wallet");
        }
        
        walletProvider = window.phantom.ethereum;
      } else {
        throw new Error("No wallet connected. Please connect your wallet first.");
      }

      // Request account access
      const accounts = await walletProvider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
      }

      // Verify the connected wallet matches the investor address
      const connectedWalletAddress = accounts[0].toLowerCase();
      if (connectedWalletAddress !== walletAddress.toLowerCase()) {
        throw new Error(`Please connect with the correct wallet address: ${walletAddress}`);
      }

      // Get current network information
      const chainId = await walletProvider.request({
        method: 'eth_chainId'
      });
      
      // Use current network without switching
      // No automatic network switching - use whatever network user is currently on

      // Create a Web3Provider using the current wallet provider
      const provider = new ethers.BrowserProvider(walletProvider);
      
      // Get the signer
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

      <div className="container mx-auto p-6 py-12">
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl text-gray-400">{t('investor')}</h1>
              <p 
                className="text-2xl cursor-pointer hover:text-blue-400 transition-colors duration-200"
                onClick={handleWalletClick}
                title={`View on ${subgraphNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>
          <div className="space-y-4">            
            {/* Swap and Register Buttons - Only show if connected wallet matches investor address and not closed */}
            {connectedAddress && walletAddress && 
             connectedAddress.toLowerCase() === walletAddress.toLowerCase() && 
             investorData?.investor?.isRegistered !== true && (
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setIsSwapMode(!isSwapMode)}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                >
                  {isSwapMode ? (
                    <>
                      <X className="mr-3 h-5 w-5" />
                      {t('close')}
                    </>
                  ) : (
                    <>
                      <Repeat className="mr-3 h-5 w-5" />
                      {t('swap')}
                    </>
                  )}
                </Button>
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t('registering')}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-3 h-5 w-5" />
                      {t('register')}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Show completion message if investor is closed */}
            {investorData?.investor?.isRegistered === true && (
              <div className="flex justify-end">
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg px-6 py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-medium">{t('registered')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Charts + Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Investor Charts */}
            <InvestorCharts 
              challengeId={challengeId} 
              investor={walletAddress} 
              network={subgraphNetwork}
              investorData={investorData}
              realTimePortfolio={realTimePortfolio}
            />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  Ranking
                </TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio" className="space-y-4">
                <Card className="bg-transparent border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-gray-100">{t('tokenHoldings')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userTokens.map((token, index) => {
                        // Get price from Uniswap data
                        const tokenPrice = uniswapPrices?.tokens?.[token.symbol]?.priceUSD || 0
                        const isLoadingPrice = isLoadingUniswap
                        const hasValidPrice = tokenPrice > 0
                        const tokenAmount = parseFloat(token.amount) || 0
                        const tokenValue = hasValidPrice ? tokenPrice * tokenAmount : 0
                        
                        return (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-4 rounded-lg bg-transparent border-0 cursor-pointer hover:bg-gray-800/30 transition-colors"
                            onClick={() => handleTokenClick(token.address)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
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
                              <div>
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
                            <div className="text-right">
                              <p className="font-medium text-gray-100">{token.amount}</p>
                              {/* Show USD value */}
                              {isLoadingPrice ? (
                                <p className="text-sm text-gray-500">{t('loading')}</p>
                              ) : tokenValue > 0 ? (
                                <p className="text-sm text-green-400">${tokenValue.toFixed(2)}</p>
                              ) : (
                                <p className="text-sm text-gray-500">$0.00</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {userTokens.length === 0 && (
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
                <Card className="bg-transparent border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-gray-100">{t('recentTransactions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                        (() => {
                          // Calculate pagination
                          const totalTransactions = Math.min(investorTransactions.length, maxPages * itemsPerPage);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                          const paginatedTransactions = investorTransactions.slice(startIndex, endIndex);
                          const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);

                          const getTransactionIcon = (type: string) => {
                            switch (type) {
                              case 'join':
                                return <User className="h-4 w-4 text-white" />
                              case 'swap':
                                return <Repeat className="h-4 w-4 text-white" />
                              case 'register':
                                return <BarChart3 className="h-4 w-4 text-white" />
                              case 'reward':
                                return <Trophy className="h-4 w-4 text-white" />
                              default:
                                return <Activity className="h-4 w-4 text-white" />
                            }
                          }

                          const getIconColor = (type: string) => {
                            switch (type) {
                              case 'join':
                                return 'bg-blue-500'
                              case 'swap':
                                return 'bg-green-500'
                              case 'register':
                                return 'bg-orange-500'
                              case 'reward':
                                return 'bg-yellow-500'
                              default:
                                return 'bg-gray-500'
                            }
                          }

                          const formatTimestamp = (timestamp: number) => {
                            return new Date(timestamp * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }

                          return (
                            <div className="space-y-4">
                              {paginatedTransactions.map((transaction) => (
                                <div 
                                  key={transaction.id} 
                                  className="flex items-center justify-between p-4 rounded-lg bg-transparent border-0 cursor-pointer hover:bg-gray-800/20 transition-colors"
                                  onClick={() => {
                                    const chainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
                                    window.open(getExplorerUrl(chainId, transaction.transactionHash), '_blank');
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full ${getIconColor(transaction.type)} flex items-center justify-center`}>
                                      {getTransactionIcon(transaction.type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-100">
                                        {transaction.type === 'swap' ? 'Swapped' : transaction.details}
                                      </div>
                                      <p className="text-sm text-gray-400">{formatTimestamp(transaction.timestamp)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {transaction.type === 'swap' ? (
                                      (() => {
                                        const swapDetails = getSwapDetails(transaction)
                                        if (swapDetails) {
                                          const fromLogo = getTokenLogo(swapDetails.fromToken, subgraphNetwork)
                                          const toLogo = getTokenLogo(swapDetails.toToken, subgraphNetwork)
                                          return (
                                            <div className="flex items-center gap-3 justify-end">
                                              <div className="flex items-center gap-2">
                                                <div className="relative">
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
                                                <span className="text-base font-medium text-gray-100">{swapDetails.fromAmount} {(swapDetails as any).fromTokenSymbol || swapDetails.fromToken}</span>
                                              </div>
                                              <ArrowRight className="h-4 w-4 text-gray-400" />
                                              <div className="flex items-center gap-2">
                                                <div className="relative">
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
                                                <span className="text-base font-medium text-gray-100">{swapDetails.toAmount && swapDetails.toAmount !== '0' ? `${swapDetails.toAmount} ` : ''}{(swapDetails as any).toTokenSymbol || swapDetails.toToken}</span>
                                              </div>
                                            </div>
                                          )
                                        }
                                        return <p className="text-base font-medium text-gray-100">{transaction.amount || '-'}</p>
                                      })()
                                    ) : transaction.type === 'join' ? (
                                      <p className="text-base font-medium text-gray-100">{transaction.amount || '-'}</p>
                                    ) : (
                                      <p className="font-medium text-gray-100">{transaction.amount || '-'}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                  <Pagination>
                                    <PaginationContent>
                                      <PaginationItem>
                                        <PaginationPrevious 
                                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                      </PaginationItem>
                                      
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            onClick={() => setCurrentPage(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      ))}
                                      
                                      <PaginationItem>
                                        <PaginationNext 
                                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                      </PaginationItem>
                                    </PaginationContent>
                                  </Pagination>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions found for this investor</p>
                          <p className="text-sm mt-2">Transaction history will appear here once you start trading</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ranking" className="space-y-4">
                <Card className="bg-transparent border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-gray-100">Ranking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                            <div className="space-y-4">
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
                                return '4️⃣';
                              case 5:
                                return '5️⃣';
                              default:
                                return rank.toString();
                            }
                          };
                          
                          // Get rank color
                          const getRankColor = (rank: number) => {
                                return 'bg-transparent border-gray-700/50 text-gray-100 hover:bg-gray-800/20';
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
                            <div 
                              key={`${user}-${rank}`} 
                              className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(rank)} ${isCurrentUser ? 'ring-2 ring-blue-500/50' : ''} ${
                                isEmptySlot ? 'cursor-default' : 'cursor-pointer transition-colors'
                              }`}
                              onClick={() => !isEmptySlot && handleUserClick(user)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10">
                                  {rank <= 3 ? (
                                    <span className="text-3xl">{getRankIcon(rank)}</span>
                                  ) : rank === 4 ? (
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                      <svg width="24" height="24" viewBox="0 0 24 24">
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          fill="#4F46E5"
                                          stroke="#FFD700"
                                          strokeWidth="1"
                                        />
                                        <text
                                          x="12"
                                          y="13"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="12"
                                          fill="#FFFFFF"
                                          fontWeight="bold"
                                        >
                                          4
                                        </text>
                                      </svg>
                                    </div>
                                  ) : rank === 5 ? (
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                      <svg width="24" height="24" viewBox="0 0 24 24">
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          fill="#10B981"
                                          fillOpacity="0.6"
                                          stroke="#FFD700"
                                          strokeWidth="1"
                                        />
                                        <text
                                          x="12"
                                          y="13"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="12"
                                          fill="#FFFFFF"
                                          fontWeight="bold"
                                        >
                                          5
                                        </text>
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                      <span className="text-sm font-bold text-white">{rank}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {isEmptySlot ? (
                                      <span className="text-gray-500 italic">Empty Slot</span>
                                    ) : (
                                      <>
                                        <span>{formattedAddress}</span>
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                                            You
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">{formatScore(score)}</div>
                                <div className={`text-sm ${parseFloat(profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatProfitRatio(profitRatio)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Pagination for Ranking */}
                        {rankingTotalPages > 1 && (
                          <div className="flex justify-center mt-6">
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
                      </div>
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
                        <div className="mt-6 pt-4 border-t border-gray-700">
                          <div className="text-xs text-gray-500 text-center">
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
            <div className="space-y-4">
              {/* Swap Assets (when swap mode is active) */}
              {isSwapMode && (
                <AssetSwap userTokens={userTokens} />
              )}
              
              {/* Portfolio Summary (always visible) */}
              <Card className="bg-gray-900 border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
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
                            width={16}
                            height={16}
                            className="rounded-full"
                            style={{ width: '16px', height: '16px' }}
                          />
                        ) : network === 'arbitrum' ? (
                          <Image 
                            src="/networks/small/arbitrum.png" 
                            alt="Arbitrum One"
                            width={16}
                            height={16}
                            className="rounded-full"
                            style={{ width: '16px', height: '16px' }}
                          />
                        ) : (
                          // Default to Ethereum icon if network is not recognized
                          <Image 
                            src="/networks/small/ethereum.png" 
                            alt="Ethereum Mainnet"
                            width={16}
                            height={16}
                            className="rounded-full"
                            style={{ width: '16px', height: '16px' }}
                          />
                        );

                        // If investor is closed, show as Finished
                        if (investorData?.investor?.isRegistered === true) {
                          return (
                            <>
                              <div className="w-5 h-5 rounded-full bg-transparent flex items-center justify-center">
                                {networkIcon}
                              </div>
                              <span className="text-xl font-medium text-red-400">{t('finished')}</span>
                            </>
                          )
                        }
                        // Otherwise show challenge active status
                        const isActive = challengeData?.challenge?.isActive
                        return (
                          <>
                            <div className="w-5 h-5 rounded-full bg-transparent flex items-center justify-center">
                              {networkIcon}
                            </div>
                            <span className={`text-xl font-medium ${isActive ? 'text-green-400' : 'text-orange-400'}`}>
                              {isActive ? t('active') : 'Pending reward'}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Portfolio Value */}
                  <div className="space-y-2">
                    <span className="text-base text-gray-400">{t('onChainValue')}</span>
                    <div className="text-4xl text-white">
                      ${currentValue.toFixed(2)}
                    </div>
                    {/* Real-time portfolio value */}
                    {realTimePortfolio && (
                      <div className="space-y-1">
                        <div className="text-base text-green-400 flex items-center gap-2">
                          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
{t('live')}: ${realTimePortfolio.totalValue.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {isLoadingUniswap && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
{t('loadingLivePrices')}
                      </div>
                    )}
                  </div>

                  {/* Gain/Loss */}
                  <div className="space-y-2">
                    <span className="text-base text-gray-400">{t('gainLoss')}</span>
                    <div className="flex items-baseline gap-3">
                      <div className={`text-4xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}${gainLoss.toFixed(2)}
                      </div>
                      <div className={`text-base ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        ({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                      </div>
                    </div>
                    {/* Real-time gain/loss */}
                    {realTimePortfolio && (
                      <div className="space-y-1">
                        {(() => {
                          const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                          const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                          const isRealTimePositive = realTimeGainLoss >= 0
                          
                          return (
                            <div>
                              <div className={`text-base flex items-center gap-2 ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}>
                                <span className="w-3 h-3 bg-current rounded-full animate-pulse"></span>
{t('live')}: {isRealTimePositive ? '+' : ''}${realTimeGainLoss.toFixed(2)} ({isRealTimePositive ? '+' : ''}{realTimeGainLossPercentage.toFixed(2)}%)
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>


                </CardContent>
              </Card>

              {/* Challenge Info */}
              <Card className="bg-gray-900 border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Challenge Type */}
                  <div className="space-y-2">
                    <span className="text-base text-gray-400">{t('challengeType')}</span>
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

                  {/* Challenge ID */}
                  <div className="space-y-2">
                    <span className="text-base text-gray-400">{t('challengeId')}</span>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full bg-gray-700 rounded-full h-3">
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
                    
                    {/* Time Info */}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('voteStart')}: {challengeDetails?.startTime.toLocaleDateString() || 'N/A'}</span>
                      <span>{t('voteEnd')}: {challengeDetails?.endTime.toLocaleDateString() || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 