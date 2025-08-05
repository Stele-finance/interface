"use client"

import React, { useState, use, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, Activity, Users, Loader2 } from "lucide-react"
import { AssetSwap } from "../../../../swap/components/AssetSwap"
import { InvestorCharts } from "./components/InvestorCharts"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useInvestorData } from "@/app/hooks/useInvestorData"
import { useUserTokens } from "@/app/hooks/useUserTokens"
import { useUserTokenPrices } from "@/app/hooks/useUniswapBatchPrices"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useInvestorTransactions } from "../../hooks/useInvestorTransactions"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { getSteleContractAddress } from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"

// Import types and utilities
import { InvestorPageProps, RealTimePortfolio } from "./types"
import { calculatePortfolioMetrics, getChallengeDetails, getTimeRemaining, getTokenExplorerUrl, getExplorerUrl, getExplorerName } from "./utils"

// Import components
import { ErrorState } from "./components/LoadingStates"
import { PortfolioTab } from "./components/PortfolioTab"
import { TransactionsTab } from "./components/TransactionsTab"
import { PortfolioSummary } from "./components/PortfolioSummary"
import { ChallengeInfo } from "./components/ChallengeInfo"
import { ActionButtons, RegisteredStatus } from "./components/ActionButtons"
import { RankingSection } from "../components/RankingSection"
import { InvestorsTab } from "../components/InvestorsTab"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function InvestorPage({ params }: InvestorPageProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const { network: routeNetwork, id: challengeId, walletAddress } = use(params)
  const router = useRouter()
  
  // Use hooks
  const { address: connectedAddress, walletType, network, getProvider } = useWallet()
  const queryClient = useQueryClient()

  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  const { data: investorData, isLoading: isLoadingInvestor, error: investorError } = useInvestorData(challengeId, walletAddress, subgraphNetwork)
  const { data: userTokens = [], isLoading: isLoadingTokens, error: tokensError } = useUserTokens(challengeId, walletAddress, subgraphNetwork)
  const { data: challengeData, isLoading: isLoadingChallenge, error: challengeError } = useChallenge(challengeId, subgraphNetwork)
  const { data: investorTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useInvestorTransactions(challengeId, walletAddress, subgraphNetwork)
  
  // Get real-time prices for user's tokens using Uniswap V3 onchain data - only if not closed
  const { data: uniswapPrices, isLoading: isLoadingUniswap, error: uniswapError } = useUserTokenPrices(
    investorData?.investor?.isRegistered === true ? [] : userTokens,
    subgraphNetwork
  )

  // State management
  const [activeTab, setActiveTab] = useState("portfolio")
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwapMode, setIsSwapMode] = useState(false)
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly'>('daily')
  const [isAssetSwapping, setIsAssetSwapping] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Calculate real-time portfolio value - Use lenient conditions like Portfolio tab
  const calculateRealTimePortfolioValue = useCallback((): RealTimePortfolio | null => {
    // Only check basic conditions - calculate if tokens and price data exist
    if (!userTokens.length || !uniswapPrices?.tokens) {
      return null
    }
    
    let totalValue = 0
    let tokensWithPrices = 0
    
    // Process individual tokens the same way as Portfolio tab
    userTokens.forEach(token => {
      const tokenPrice = uniswapPrices.tokens[token.symbol]?.priceUSD || 0
      const tokenAmount = parseFloat(token.amount) || 0
      
      // Only include tokens with price in calculation (same as Portfolio tab)
      if (tokenPrice > 0 && tokenAmount > 0) {
        totalValue += tokenPrice * tokenAmount
        tokensWithPrices++
      }
    })
    
    // Display if at least one token has price (same leniency as Portfolio tab)
    return {
      totalValue,
      tokensWithPrices,
      totalTokens: userTokens.length,
      timestamp: uniswapPrices.timestamp || Date.now(),
      // Add flag to allow display regardless of registration status
      isRegistered: investorData?.investor?.isRegistered === true
    }
  }, [userTokens, uniswapPrices, investorData])

  // Remove useCallback for immediate reaction (same as Portfolio tab)
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

  // Handle token row click
  const handleTokenClick = (tokenAddress: string) => {
    window.open(getTokenExplorerUrl(tokenAddress, subgraphNetwork), '_blank')
  }

  // Handle Register button click - show confirmation modal
  const handleRegisterClick = () => {
    setShowRegisterModal(true)
  }

  // Handle actual registration after confirmation
  const handleConfirmRegister = async () => {
    setShowRegisterModal(false)
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

  // Handle cancel registration
  const handleCancelRegister = () => {
    setShowRegisterModal(false)
  }

  // Computed values
  const portfolioMetrics = investorData?.investor ? calculatePortfolioMetrics(investorData.investor) : null
  const challengeDetails = getChallengeDetails(challengeData)
  const timeRemaining = getTimeRemaining(challengeDetails, currentTime, isClient, t as any)

  // Handle loading and error states - removed main loading state for better UX

  // Handle errors by showing loading UI instead of 404
  if (investorError || tokensError || challengeError || transactionsError || !investorData?.investor) {    
    return <ErrorState challengeId={challengeId} walletAddress={walletAddress} />
  }

  const investor = investorData.investor

  return (
    <>
      {/* Loading Overlay */}
      {isRefreshing && isMounted && createPortal(
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
        </div>,
        document.body
      )}

      <div className="container mx-auto p-2 sm:p-6 py-4 sm:py-4">
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-0">
          {/* Go to Challenge Button */}
          <div className="px-2 sm:px-0">
          <button 
            onClick={() => router.push(`/challenge/${challengeId}`)}
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('goToChallenge')} {challengeId}
          </button>
        </div>

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
                <TabsTrigger value="investors" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('investor')}
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('transactions')}
                </TabsTrigger>
              </TabsList>
                
              <TabsContent value="portfolio" className="space-y-4">
                <PortfolioTab 
                  userTokens={userTokens}
                  uniswapPrices={uniswapPrices}
                  isLoadingUniswap={isLoadingUniswap}
                  subgraphNetwork={subgraphNetwork}
                  onTokenClick={handleTokenClick}
                />
              </TabsContent>

              <TabsContent value="investors" className="space-y-4">
                <InvestorsTab 
                  challengeId={challengeId}
                  subgraphNetwork={subgraphNetwork}
                />
              </TabsContent>

                            <TabsContent value="transactions" className="space-y-4">
                <TransactionsTab 
                  challengeId={challengeId}
                  investorTransactions={investorTransactions}
                  isLoadingTransactions={isLoadingTransactions}
                  transactionsError={transactionsError}
                  subgraphNetwork={subgraphNetwork}
                  walletAddress={walletAddress}
                />
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
                  <ActionButtons 
                    connectedAddress={connectedAddress}
                    walletAddress={walletAddress}
                    isRegistered={investorData?.investor?.isRegistered === true}
                    isSwapMode={isSwapMode}
                    isRegistering={isRegistering}
                    isAssetSwapping={isAssetSwapping}
                    onSwapModeToggle={() => setIsSwapMode(!isSwapMode)}
                    onRegister={handleRegisterClick}
                  />
                   
                   {/* Desktop Registered status - Show on desktop, hide on mobile */}
                  {investorData?.investor?.isRegistered === true && <RegisteredStatus />}
                 </div>
              </div>
              
              {/* Swap Assets (when swap mode is active) */}
              {/* Desktop version - static position */}
              {isSwapMode && (
                <div className="hidden md:block">
                  <AssetSwap 
                    userTokens={userTokens} 
                    onSwappingStateChange={setIsAssetSwapping}
                  />
                </div>
              )}
              
              {/* Mobile version - floating */}
              {isSwapMode && isMounted && createPortal(
                <div className="fixed inset-0 z-50 md:hidden">
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSwapMode(false)} />
                  <div className="fixed inset-0 flex items-center justify-center p-4" onClick={() => setIsSwapMode(false)}>
                    <div className="w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-muted rounded-2xl p-6 shadow-2xl">
                        <AssetSwap 
                          userTokens={userTokens} 
                          onSwappingStateChange={setIsAssetSwapping}
                        />
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
              
              {/* Portfolio Summary (always visible) */}
              {portfolioMetrics && (
                <PortfolioSummary 
                  portfolioMetrics={portfolioMetrics}
                  realTimePortfolio={realTimePortfolio}
                  isLoadingUniswap={isLoadingUniswap}
                  challengeData={challengeData}
                  network={network || 'ethereum'}
                  investorData={investorData}
                />
              )}

              {/* Challenge Info */}
              <ChallengeInfo 
                challengeId={challengeId}
                challengeData={challengeData}
                challengeDetails={challengeDetails}
                timeRemaining={timeRemaining}
                isClient={isClient}
                currentTime={currentTime}
              />

              {/* Ranking Section */}
              <RankingSection 
                challengeId={challengeId}
                network={subgraphNetwork}
              />
                      </div>
                    </div>
                      </div>
      </div>
    </div>

      {/* Registration Confirmation Modal */}
      <AlertDialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('register')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register for this challenge?
              <br />
              <br />
              <span className="font-medium text-orange-400">
                {t('challenge')}: {challengeId}
              </span>
              <br />
              <span className="font-medium text-blue-400">
                {t('address')}: {walletAddress}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRegister}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRegister}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {t('register')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 