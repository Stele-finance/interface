"use client"

import React, { useState, use, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, ChevronDown } from "lucide-react"
import { ChallengeAssetSwap } from "../../../../swap/components/ChallengeAssetSwap"
import { InvestorCharts } from "./components/InvestorCharts"
import { useLanguage } from "@/lib/language-context"
import { useInvestorData } from "@/app/hooks/useChallengeInvestorData"
import { useUserTokens } from "@/app/hooks/useUserTokens"
import { useUserTokenPrices } from "@/app/hooks/useUniswapBatchPrices"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useChallengeInvestableTokens } from "@/app/hooks/useChallengeInvestableTokens"
import { useInvestorTransactions } from "../../hooks/useInvestorTransactions"
import { usePerformanceNFT } from "../../hooks/usePerformanceNFT"
import { useRanking } from "@/app/hooks/useRanking"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ethers } from "ethers"
import { getSteleContractAddress } from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"

// Import types and utilities
import { InvestorPageProps, RealTimePortfolio } from "./types"
import { calculatePortfolioMetrics, getChallengeDetails, getTokenExplorerUrl } from "./utils"

// Import components
import { ErrorState } from "./components/LoadingStates"
import { PortfolioTab } from "./components/PortfolioTab"
import { TransactionsTab } from "./components/TransactionsTab"
import { PortfolioSummary } from "./components/PortfolioSummary"
import { ActionButtons } from "./components/ActionButtons"
import { RankingSection } from "../components/RankingSection"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { isUserInTop5 } from "./utils/rankingUtils"

export default function InvestorPage({ params }: InvestorPageProps) {
  const { t } = useLanguage()
  const { network: routeNetwork, id: challengeId, walletAddress } = use(params)
  const router = useRouter()

  // Use hooks
  const { address: connectedAddress, getProvider } = useWallet()
  const queryClient = useQueryClient()

  // Use URL network parameter instead of wallet network for subgraph
  const subgraphNetwork = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum'

  // Listen for network changes from Header and redirect to challenges page
  useEffect(() => {
    const handleNetworkChanged = (event: CustomEvent) => {
      const { network: newNetwork } = event.detail
      // If network changed, redirect to challenges page with new network
      if (newNetwork !== routeNetwork) {
        router.push('/challenges')
      }
    }

    window.addEventListener('networkChanged', handleNetworkChanged as EventListener)

    return () => {
      window.removeEventListener('networkChanged', handleNetworkChanged as EventListener)
    }
  }, [routeNetwork, router])
  
  const { data: investorData, error: investorError } = useInvestorData(challengeId, walletAddress, subgraphNetwork)
  const { data: userTokens = [], error: tokensError } = useUserTokens(challengeId, walletAddress, subgraphNetwork)
  const { data: challengeData, error: challengeError } = useChallenge(challengeId, subgraphNetwork)
  const { data: investorTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useInvestorTransactions(challengeId, walletAddress, subgraphNetwork)
  const { data: performanceNFT } = usePerformanceNFT(challengeId, walletAddress, subgraphNetwork)
  const { data: rankingData } = useRanking(challengeId, subgraphNetwork)

  // Get investable tokens for swap (network-specific)
  const { data: investableTokensData } = useChallengeInvestableTokens(subgraphNetwork)
  const investableTokens = investableTokensData?.investableTokens.map(token => ({
    id: token.id,
    address: token.tokenAddress,
    symbol: token.symbol,
    decimals: token.decimals,
    isInvestable: token.isInvestable,
    updatedTimestamp: token.updatedTimestamp
  })) || []

  // Get token prices for user's tokens (network-specific)
  // Only fetch prices if challenge is not ended (to avoid rate limiting)
  const shouldFetchPrices = challengeData?.challenge ? (() => {
    const endTime = new Date(parseInt(challengeData.challenge.endTime) * 1000)
    return new Date() < endTime && challengeData.challenge.isActive
  })() : true

  const { data: tokenPricesData, isLoading: isLoadingUniswap } = useUserTokenPrices(
    shouldFetchPrices ? userTokens : [],
    subgraphNetwork
  )

  // State management
  const [activeTab, setActiveTab] = useState("portfolio")
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwapMode, setIsSwapMode] = useState(false)
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [isAssetSwapping, setIsAssetSwapping] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false)
  const intervalDropdownRef = useRef<HTMLDivElement>(null)

  // Calculate real-time portfolio value using network-specific token prices
  const calculateRealTimePortfolioValue = useCallback((): RealTimePortfolio | null => {
    if (!userTokens.length || !tokenPricesData) {
      return null
    }

    let totalValue = 0
    let tokensWithPrices = 0

    // Process individual tokens using network-specific token prices
    userTokens.forEach(token => {
      const priceInfo = tokenPricesData.tokens?.[token.symbol]
      const tokenPrice = priceInfo?.priceUSD || 0
      const tokenAmount = parseFloat(token.amount) || 0

      // Only include tokens with price in calculation
      if (tokenPrice > 0 && tokenAmount > 0) {
        totalValue += tokenPrice * tokenAmount
        tokensWithPrices++
      }
    })

    return {
      totalValue,
      tokensWithPrices,
      totalTokens: userTokens.length,
      timestamp: Date.now(),
      isRegistered: investorData?.investor !== null && investorData?.investor !== undefined
    }
  }, [userTokens, tokenPricesData, investorData])

  // Remove useCallback for immediate reaction (same as Portfolio tab)
  // Don't show real-time portfolio during swap to avoid incorrect values
  const realTimePortfolio = isAssetSwapping ? null : calculateRealTimePortfolioValue()

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

  // Handle click outside for interval dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (intervalDropdownRef.current && !intervalDropdownRef.current.contains(event.target as Node)) {
        setShowIntervalDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [])

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
      // Get provider - same approach as Fund Create
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      // Use URL network parameter for contract interaction
      const contractNetwork = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum';

      // Always switch to the selected network before making the transaction
      const targetChainId = contractNetwork === 'arbitrum' ? 42161 : 1;

      // Try to switch to the selected network
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added to wallet, add it
          const networkConfig = contractNetwork === 'arbitrum' ? {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/']
          } : {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
          };

          await provider.send('wallet_addEthereumChain', [networkConfig]);
        } else if (switchError.code === 4001) {
          // User rejected the network switch
          const networkName = contractNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to register.`);
        } else {
          throw switchError;
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner();
      const connectedWalletAddress = await signer.getAddress();

      // Verify the connected wallet matches the investor address
      if (connectedWalletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(`Please connect with the correct wallet address: ${walletAddress}`);
      }

      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call register function with challengeId
      const tx = await steleContract.register(challengeId);

      // Wait for transaction to be mined
      await tx.wait();

      // Start refreshing process
      setIsRefreshing(true);

      // Refresh data after 3 seconds using React Query
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['challenge', challengeId, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['transactions', challengeId, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['ranking', challengeId, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['investorData', challengeId, walletAddress, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['userTokens', challengeId, walletAddress, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['investorSnapshots', challengeId, walletAddress, subgraphNetwork],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'challengeSnapshots' &&
            query.queryKey[1] === challengeId &&
            query.queryKey[3] === subgraphNetwork,
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'challengeWeeklySnapshots' &&
            query.queryKey[1] === challengeId &&
            query.queryKey[3] === subgraphNetwork,
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'challengeMonthlySnapshots' &&
            query.queryKey[1] === challengeId &&
            query.queryKey[3] === subgraphNetwork,
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['challengeInvestors', challengeId, subgraphNetwork],
          refetchType: 'active'
        });
        setIsRefreshing(false);
      }, 3000);

    } catch (error: any) {
      console.error("Error registering investor:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle cancel registration
  const handleCancelRegister = () => {
    setShowRegisterModal(false)
  }

  // Handle mint NFT
  const handleMintNFT = async () => {
    setIsMinting(true);

    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      const targetChainId = routeNetwork === 'arbitrum' ? 42161 : 1;

      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const networkParams = routeNetwork === 'arbitrum' ? {
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: 'Arbitrum One',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io']
          } : {
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: 'Ethereum Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
            blockExplorerUrls: ['https://etherscan.io']
          };

          await provider.send('wallet_addEthereumChain', [networkParams]);
        } else if (switchError.code === 4001) {
          const networkName = routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to mint NFT.`);
        } else {
          throw switchError;
        }
      }

      // Get fresh provider after network switch
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner();
      const userAddress = await signer.getAddress();

      // Verify the connected wallet matches the investor address
      if (userAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(`Please connect with the correct wallet address: ${walletAddress}`);
      }

      // Get contract address for URL network parameter
      const networkParam = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum';
      const contractAddress = getSteleContractAddress(networkParam);

      // Create contract instance - use .abi property from Hardhat artifact
      const contract = new ethers.Contract(contractAddress, SteleABI.abi, signer);

      // Call mintPerformanceNFT function
      const transaction = await contract.mintPerformanceNFT(challengeId);

      // Wait for transaction confirmation
      const receipt = await transaction.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsMinting(false);
    }
  }

  // Computed values
  const portfolioMetrics = investorData?.investor ? calculatePortfolioMetrics(investorData.investor) : null
  const challengeDetails = getChallengeDetails(challengeData)
  const isChallengeEnded = challengeDetails && currentTime >= challengeDetails.endTime;

  // Determine challenge state
  const getChallengeState = () => {
    if (!challengeData?.challenge) return 'unknown';
    const isActive = challengeData.challenge.isActive === true;
    const hasTimePassed = challengeDetails && currentTime >= challengeDetails.endTime;
    
    if (isActive && !hasTimePassed) return 'active';
    if (isActive && hasTimePassed) return 'pending';
    return 'end';
  };
  
  const challengeState = getChallengeState();
  
  // Check if user is in top 5 for mint NFT eligibility
  const userInTop5 = isUserInTop5(rankingData ?? null, walletAddress)
  
  // Check if NFT has been minted (disable mint button if already minted)
  const hasNFTMinted = !!performanceNFT

  // Handle loading and error states - removed main loading state for better UX

  // Handle errors by showing loading UI instead of 404
  if (investorError || tokensError || challengeError || transactionsError || !investorData?.investor) {    
    return <ErrorState challengeId={challengeId} walletAddress={walletAddress} />
  }

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
            onClick={() => router.push(`/challenge/${routeNetwork}/${challengeId}`)}
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
              currentTime={currentTime}
              isClient={isClient}
            />
            
            {/* Time interval dropdown - same style as fund investor page */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-8 pb-2">
              <div className="relative" ref={intervalDropdownRef}>
                <button
                  onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                  className="flex items-center gap-2 px-6 py-1.5 text-sm font-medium bg-gray-800/60 border border-gray-700/50 rounded-full shadow-lg backdrop-blur-sm text-gray-400 hover:text-white hover:bg-gray-700/30 h-[38px]"
                >
                  <Calendar className="h-4 w-4" />
                  {chartInterval === 'daily' ? t('daily') : chartInterval === 'weekly' ? t('weekly') : t('monthly')}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showIntervalDropdown && (
                  <div className="absolute top-full mt-2 right-0 w-32 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                    <button
                      onClick={() => {
                        setChartInterval('daily')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('daily')}
                    </button>
                    <button
                      onClick={() => {
                        setChartInterval('weekly')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('weekly')}
                    </button>
                    <button
                      onClick={() => {
                        setChartInterval('monthly')
                        setShowIntervalDropdown(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                    >
                      {t('monthly')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 md:mr-8">
              <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-8">
                <TabsTrigger
                  value="portfolio"
                  className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {t('portfolio')}
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {t('transactions')}
                </TabsTrigger>
              </TabsList>
                
              <TabsContent value="portfolio" className="space-y-4">
                <PortfolioTab
                  investorData={investorData}
                  isLoadingUniswap={isLoadingUniswap}
                  subgraphNetwork={subgraphNetwork}
                  onTokenClick={handleTokenClick}
                  isChallengeEnded={!!isChallengeEnded}
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
                    challengeState={challengeState}
                    userInTop5={userInTop5}
                    hasNFTMinted={hasNFTMinted}
                    isSwapMode={isSwapMode}
                    isRegistering={isRegistering}
                    isAssetSwapping={isAssetSwapping}
                    isMinting={isMinting}
                    onSwapModeToggle={() => setIsSwapMode(!isSwapMode)}
                    onRegister={handleRegisterClick}
                    onMintNFT={handleMintNFT}
                  />
                 </div>
              </div>
              
              {/* Swap Assets (when swap mode is active) */}
              {/* Desktop version - static position */}
              {isSwapMode && (
                <div className="hidden md:block">
                  <ChallengeAssetSwap
                    userTokens={userTokens}
                    investorData={investorData}
                    investableTokens={investableTokens}
                    onSwappingStateChange={setIsAssetSwapping}
                    network={subgraphNetwork}
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
                        <ChallengeAssetSwap
                          userTokens={userTokens}
                          investorData={investorData}
                          investableTokens={investableTokens}
                          onSwappingStateChange={setIsAssetSwapping}
                          network={subgraphNetwork}
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
                  network={routeNetwork || 'ethereum'}
                  investorData={investorData}
                  walletAddress={walletAddress}
                  currentTime={currentTime}
                  isClient={isClient}
                />
              )}

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