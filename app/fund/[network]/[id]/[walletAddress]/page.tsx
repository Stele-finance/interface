"use client"

import React, { useState, use, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Activity, Users, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useFundInvestorData } from "../hooks/useFundInvestorData"
import { FundInvestorCharts } from "../components/FundInvestorCharts"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { FundErrorState } from "./components/FundErrorState"

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

  // Handle error states and missing data
  if (investorError || !fundInvestorData?.investor) {    
    return <FundErrorState fundId={fundId} walletAddress={walletAddress} routeNetwork={routeNetwork} />
  }

  const investor = fundInvestorData.investor

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
            <FundInvestorCharts 
              fundId={fundId}
              investor={walletAddress}
              network={subgraphNetwork as 'ethereum' | 'arbitrum'}
              isLoadingInvestor={isLoadingInvestor}
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('portfolio')}
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('transactions')}
                  </TabsTrigger>
                </TabsList>
                  
                <TabsContent value="portfolio" className="space-y-4">
                  <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Portfolio Details</h4>
                    <div className="space-y-3">
                      {investor.currentTokensSymbols?.map((symbol, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/30 last:border-b-0">
                          <span className="text-gray-300">{symbol}</span>
                          <span className="text-gray-100">{investor.currentTokensAmount?.[index] || '0'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Transactions</h4>
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found for this investor</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Side - Investment Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-6 lg:mt-10 md:space-y-4">
                {/* Investment Summary */}
                <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">Investment Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <span className="text-sm text-gray-400">Investor</span>
                      <span className="text-sm text-white font-medium">
                        {`${investor.investor.slice(0, 6)}...${investor.investor.slice(-4)}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <span className="text-sm text-gray-400">Manager</span>
                      <span className="text-sm text-white font-medium">
                        {investor.isManager ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <span className="text-sm text-gray-400">Principal</span>
                      <span className="text-sm text-white font-medium">
                        ${parseFloat(investor.principalUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
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
                      <span className="text-sm text-gray-400">ROI</span>
                      <span className={`text-sm font-medium ${parseFloat(investor.profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(investor.profitRatio) >= 0 ? '+' : ''}{(parseFloat(investor.profitRatio) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fund Info */}
                <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">Fund Info</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <span className="text-sm text-gray-400">Fund ID</span>
                      <span className="text-sm text-white font-medium">#{fundId}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <span className="text-sm text-gray-400">Network</span>
                      <span className="text-sm text-white font-medium capitalize">{subgraphNetwork}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-400">Status</span>
                      <span className="text-sm text-green-400 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 