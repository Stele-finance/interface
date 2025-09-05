"use client"

import React, { useState, use, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Activity, Loader2, Calendar, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AssetSwap } from "../../../../swap/components/AssetSwap"
import { InvestorCharts } from "./components/InvestorCharts"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import { useInvestorData } from "@/app/hooks/useInvestorData"
import { useUserTokens } from "@/app/hooks/useUserTokens"
import { useTokenPrices } from "@/lib/token-price-context"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useInvestorTransactions } from "../../hooks/useInvestorTransactions"
import { usePerformanceNFT } from "../../hooks/usePerformanceNFT"
import { useRanking } from "@/app/hooks/useRanking"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { isUserInTop5 } from "./utils/rankingUtils"

export default function InvestorPage({ params }: InvestorPageProps) {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const { network: routeNetwork, id: challengeId, walletAddress } = use(params)
  const router = useRouter()
  
  // Use hooks
  const { address: connectedAddress, walletType, getProvider } = useWallet()
  const queryClient = useQueryClient()

  // Use URL network parameter instead of wallet network for subgraph
  const subgraphNetwork = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum'
  
  const { data: investorData, error: investorError } = useInvestorData(challengeId, walletAddress, subgraphNetwork)
  const { data: userTokens = [], error: tokensError } = useUserTokens(challengeId, walletAddress, subgraphNetwork)
  const { data: challengeData, error: challengeError } = useChallenge(challengeId, subgraphNetwork)
  const { data: investorTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useInvestorTransactions(challengeId, walletAddress, subgraphNetwork)
  const { data: performanceNFT } = usePerformanceNFT(challengeId, walletAddress, subgraphNetwork)
  const { data: rankingData } = useRanking(challengeId, subgraphNetwork)
  
  // Get token prices from global context
  const { getTokenPriceBySymbol, isLoading: isLoadingUniswap } = useTokenPrices()

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

  // Calculate real-time portfolio value using global token prices
  const calculateRealTimePortfolioValue = useCallback((): RealTimePortfolio | null => {
    if (!userTokens.length) {
      return null
    }
    
    let totalValue = 0
    let tokensWithPrices = 0
    
    // Process individual tokens using global token prices
    userTokens.forEach(token => {
      const priceData = getTokenPriceBySymbol(token.symbol)
      const tokenPrice = priceData?.priceUSD || 0
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
  }, [userTokens, getTokenPriceBySymbol, investorData])

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

      // Get wallet's current network
      const walletChainId = await provider.send('eth_chainId', []);
      const expectedChainId = routeNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
      // If wallet is on wrong network, switch to URL-based network
      if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        try {
          // Request network switch
          await provider.send('wallet_switchEthereumChain', [
            { chainId: expectedChainId }
          ]);
        } catch (switchError: any) {
          // If network doesn't exist in wallet (error 4902), add it
          if (switchError.code === 4902) {
            try {
              const networkParams = routeNetwork === 'arbitrum' ? {
                chainId: expectedChainId,
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
              } : {
                chainId: expectedChainId,
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
            } catch (addError) {
              const networkName = routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
              throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
            }
          } else if (switchError.code === 4001) {
            // User rejected the switch
            const networkName = routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Please switch to ${networkName} network to register.`);
          } else {
            throw switchError;
          }
        }
      }
      
      // Get signer after ensuring correct network
      const signer = await provider.getSigner();
      
      // Use URL network parameter for contract interaction
      const contractNetwork = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum';
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call register function with challengeId
      const tx = await steleContract.register(challengeId);
      
      // Show toast notification for transaction submitted
      const registerExplorerName = getExplorerName(walletChainId);
      const registerExplorerUrl = getExplorerUrl(walletChainId, tx.hash);
      
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

  // Handle mint NFT
  const handleMintNFT = async () => {
    setIsMinting(true);
    
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

      // Get wallet's current network
      const walletChainId = await provider.send('eth_chainId', []);
      const expectedChainId = routeNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
      // If wallet is on wrong network, switch to URL-based network
      if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        try {
          // Request network switch
          await provider.send('wallet_switchEthereumChain', [
            { chainId: expectedChainId }
          ]);
        } catch (switchError: any) {
          // If network doesn't exist in wallet (error 4902), add it
          if (switchError.code === 4902) {
            try {
              const networkParams = routeNetwork === 'arbitrum' ? {
                chainId: expectedChainId,
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
              } : {
                chainId: expectedChainId,
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
            } catch (addError) {
              const networkName = routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
              throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
            }
          } else if (switchError.code === 4001) {
            // User rejected the switch
            const networkName = routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Please switch to ${networkName} network to mint NFT.`);
          } else {
            throw switchError;
          }
        }
      }
      
      // Get contract address for URL network parameter
      const networkParam = routeNetwork === 'ethereum' || routeNetwork === 'arbitrum' ? routeNetwork : 'ethereum';
      const contractAddress = getSteleContractAddress(networkParam);
      
      // Get signer after ensuring correct network
      const signer = await provider.getSigner();

      // Create contract instance - use .abi property from Hardhat artifact
      const contract = new ethers.Contract(contractAddress, SteleABI.abi, signer);

      // Call mintPerformanceNFT function
      const transaction = await contract.mintPerformanceNFT(challengeId);
      
      // Show toast notification
      toast({
        title: t('mintingNFT'),
        description: `Transaction sent: ${transaction.hash}`,
        action: (
          <ToastAction 
            altText={t('viewOnExplorer')} 
            onClick={() => window.open(getExplorerUrl(walletChainId, transaction.hash), '_blank')}
          >
            {t('viewOnExplorer')}
          </ToastAction>
        ),
      });

      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      
      if (receipt.status === 1) {
        // Show success toast
        toast({
          title: t('nftMintedSuccessfully'),
          description: `NFT minted successfully! Transaction: ${transaction.hash}`,
          action: (
            <ToastAction 
              altText={t('viewOnExplorer')} 
              onClick={() => window.open(getExplorerUrl(walletChainId, transaction.hash), '_blank')}
            >
              {t('viewOnExplorer')}
            </ToastAction>
          ),
        });
      }
      
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      
      // Show toast notification for error
      toast({
        variant: "destructive",
        title: "NFT Minting Failed",
        description: error.message || "An unknown error occurred",
      });
      
    } finally {
      setIsMinting(false);
    }
  }

  // Computed values
  const portfolioMetrics = investorData?.investor ? calculatePortfolioMetrics(investorData.investor) : null
  const challengeDetails = getChallengeDetails(challengeData)
  const timeRemaining = getTimeRemaining(challengeDetails, currentTime, isClient, t as any)
  const isChallengeEnded = challengeDetails && new Date() > challengeDetails.endTime;
  
  // Determine challenge state
  const getChallengeState = () => {
    if (!challengeData?.challenge) return 'unknown';
    const isActive = challengeData.challenge.isActive === true;
    const hasTimePassed = challengeDetails && new Date() > challengeDetails.endTime;
    
    if (isActive && !hasTimePassed) return 'active';
    if (isActive && hasTimePassed) return 'pending';
    return 'end';
  };
  
  const challengeState = getChallengeState();
  
  // Check if user is in top 5 for mint NFT eligibility
  const userInTop5 = isUserInTop5(rankingData, walletAddress)
  
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
            />
            
            {/* Time interval dropdown - same style as fund investor page */}
            <div className="flex justify-end px-2 sm:px-0 -mt-4 sm:-mt-2 mb-2 md:mr-8 pb-2">
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
            
            {/* Separator Bar */}
            <div className="border-t border-gray-600/50 mx-2 sm:mx-0 md:mr-8 pb-2"></div>
            
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
                <PortfolioTab 
                  userTokens={userTokens}
                  isLoadingUniswap={isLoadingUniswap}
                  subgraphNetwork={subgraphNetwork}
                  onTokenClick={handleTokenClick}
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
                  network={routeNetwork || 'ethereum'}
                  investorData={investorData}
                  walletAddress={walletAddress}
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
                network={subgraphNetwork}
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

      {/* Mobile Mint NFT Button - Show only when registered and challenge ended */}
      {investorData?.investor && isChallengeEnded && !isMobileMenuOpen && isMounted && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="p-4">
            <Button 
              variant="default" 
              size="lg" 
              onClick={handleMintNFT}
              disabled={isMinting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white border-orange-500 hover:border-orange-600 disabled:border-orange-500/50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('mintNFT')}
                </>
              )}
            </Button>
          </div>
        </div>,
        document.body
      )}

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