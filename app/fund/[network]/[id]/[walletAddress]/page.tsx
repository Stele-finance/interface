"use client"

import React, { useState, use, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Activity, Users, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useFundInvestorData } from "../hooks/useFundInvestorData"
import { useFundData } from "../hooks/useFundData"
import { useFundTransactions } from "../hooks/useFundTransactions"
import { FundInvestorCharts } from "../components/FundInvestorCharts"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { FundErrorState } from "./components/FundErrorState"
import { FundActionTabs } from "./components/FundActionTabs"

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

  // State management
  const [activeTab, setActiveTab] = useState("portfolio")
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly'>('daily')
  const [isMounted, setIsMounted] = useState(false)

  // Calculate real-time portfolio value based on fund investor data
  const calculateRealTimePortfolioValue = useCallback((): RealTimePortfolio | null => {
    if (!fundInvestorData?.investor) {
      return null
    }
    
    const investor = fundInvestorData.investor
    const currentValue = parseFloat(investor.currentUSD) || 0
    const totalTokens = investor.currentTokensSymbols?.length || 0
    
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

  // Get investor data if available
  const investor = fundInvestorData?.investor
  const isInvestor = !!investor
  
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
              />
            ) : (
              <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center text-gray-400">
                  <h3 className="text-lg font-semibold mb-2">No Investment Data</h3>
                  <p className="text-sm">This address has not invested in this fund yet</p>
                </div>
              </div>
            )}
            
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
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Portfolio Details</h4>
                    {fundData?.fund ? (
                      <div className="space-y-3">
                        {fundData.fund.currentTokensSymbols?.map((symbol, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/30 last:border-b-0">
                            <span className="text-gray-300">{symbol}</span>
                            <span className="text-gray-100">{fundData.fund?.currentTokensAmount?.[index] || '0'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No portfolio data available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Transactions</h4>
                    
                    {isLoadingTransactions ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
                        <p className="text-gray-400">Loading transactions...</p>
                      </div>
                    ) : transactionsError ? (
                      <div className="text-center py-8 text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Error loading transactions</p>
                      </div>
                    ) : fundTransactions.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {fundTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center py-3 px-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  transaction.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                                  transaction.type === 'withdraw' ? 'bg-red-500/20 text-red-400' :
                                  transaction.type === 'swap' ? 'bg-blue-500/20 text-blue-400' :
                                  transaction.type === 'join' ? 'bg-purple-500/20 text-purple-400' :
                                  transaction.type === 'create' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {transaction.type.toUpperCase()}
                                </span>
                                {transaction.amount && (
                                  <span className="text-sm font-medium text-gray-200">
                                    {transaction.amount}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300">{transaction.details}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.timestamp * 1000).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <button 
                                onClick={() => {
                                  const explorerUrl = subgraphNetwork === 'arbitrum' 
                                    ? `https://arbiscan.io/tx/${transaction.transactionHash}`
                                    : `https://etherscan.io/tx/${transaction.transactionHash}`
                                  window.open(explorerUrl, '_blank')
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                View Tx
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No transactions found for this investor</p>
                      </div>
                    )}
                  </div>
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
                  <h3 className="text-xl font-bold text-gray-100 mb-4">Fund Info</h3>
                  
                  {investor ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Fund ID</span>
                        <span className="text-sm text-white font-medium">#{fundId}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Network</span>
                        <span className="text-sm text-white font-medium capitalize">{subgraphNetwork}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">Current Value</span>
                        <span className="text-sm text-white font-medium">
                          ${parseFloat(investor.currentUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-sm text-gray-400">P&L</span>
                        <span className={`text-sm font-medium ${parseFloat(investor.profitUSD) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseFloat(investor.profitUSD) >= 0 ? '+' : ''}${parseFloat(investor.profitUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400">My Share</span>
                        <span className="text-sm text-white font-medium">
                          {fundData?.fund?.currentUSD ? ((parseFloat(investor.currentUSD) / parseFloat(fundData.fund.currentUSD)) * 100).toFixed(2) : '0.00'}%
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