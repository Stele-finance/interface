"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent} from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowRight, Loader2, User, Users, Receipt, ArrowLeftRight, Activity, Image as ImageIcon, DollarSign, Plus, PieChart, Wallet } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { ethers } from "ethers"
import { formatDateWithLocale, formatDateOnly } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { FundCharts } from "./FundCharts"
import { useRouter } from "next/navigation"
import { 
  getSteleContractAddress,
  getUSDCTokenAddress,
  getRPCUrl,
  USDC_DECIMALS,
  NETWORK_CONTRACTS
} from "@/lib/constants"
// Mock data instead of real hooks
// import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import SteleABI from "@/app/abis/Stele.json"
import SteleFundABI from "@/app/abis/SteleFund.json"
import ERC20ABI from "@/app/abis/ERC20.json"
import SteleFundManagerNFTABI from "@/app/abis/SteleFundManagerNFT.json"
import { useFundData } from "../hooks/useFundData"
import Image from "next/image"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"
import { useAppKitProvider } from '@reown/appkit/react'
import { useUSDCBalance } from "@/app/hooks/useUSDCBalance"
import { getTokenLogo } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvestorsTab } from "./InvestorsTab"
import { useFundInvestorData } from "../hooks/useFundInvestorData"
import { useFundInvestors } from "../hooks/useFundInvestors"
import { useFundAllTransactions } from "../hooks/useFundAllTransactions"
import { useFundInvestableTokenPrices } from "../../../hooks/useFundInvestableTokenPrices"

interface FundDetailProps {
  fundId: string
  network: string // Make network required since it comes from URL
}



export function FundDetail({ fundId, network }: FundDetailProps) {
  const { t, language } = useLanguage()
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);
  // Use network from URL params (not wallet network)
  const routeNetwork = network; // This comes from URL: /fund/[network]/[id]
  const [isGettingRewards, setIsGettingRewards] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasJoinedLocally, setHasJoinedLocally] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showGetRewardsModal, setShowGetRewardsModal] = useState(false);
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Mobile tooltip state for Type and Status
  const [showTypeTooltip, setShowTypeTooltip] = useState(false)
  const [showStatusTooltip, setShowStatusTooltip] = useState(false)
  const [typeTooltipTimer, setTypeTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [statusTooltipTimer, setStatusTooltipTimer] = useState<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState("investors")
  const [isMounted, setIsMounted] = useState(false)
  const [isMintingNFT, setIsMintingNFT] = useState(false)
  const itemsPerPage = 5;
  const maxPages = 5;
  
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
  
  // Mock entry fee instead of useEntryFee hook
  const entryFee = "10"
  const isLoadingEntryFee = false
  
  // Use wallet hook to get current wallet info
  const { address: connectedAddress, isConnected, walletType, network: walletNetwork, connectWallet, getProvider } = useWallet();
  
  // Use AppKit provider for WalletConnect
  const appKitProvider = useAppKitProvider('eip155');
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
  
  // Get real fund data from subgraph based on URL network
  const { data: fundData, isLoading, error } = useFundData(fundId, subgraphNetwork as 'ethereum' | 'arbitrum')
  
  const fund = fundData?.fund
  const data = { fund }

  // Get fund investor data to check if user has joined (after fund data is available)
  const { data: fundInvestorData, isLoading: isLoadingFundInvestor, refetch: refetchFundInvestorData } = useFundInvestorData(
    fundId,
    connectedAddress || "",
    subgraphNetwork as 'ethereum' | 'arbitrum'
  );

  // Get manager's portfolio data
  const { data: managerInvestorData, isLoading: isLoadingManagerData } = useFundInvestorData(
    fundId,
    fund?.manager || "",
    subgraphNetwork as 'ethereum' | 'arbitrum'
  );

  // Get USDC balance using hook
  const { data: usdcBalanceData, isLoading: isLoadingUSDCBalance, error: usdcBalanceError } = useUSDCBalance(
    connectedAddress || null,
    subgraphNetwork as 'ethereum' | 'arbitrum'
  );
  const usdcBalance = usdcBalanceData?.balance || "0"

  // Wallet connection modal state
  const [walletSelectOpen, setWalletSelectOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle wallet connection - WalletConnect only
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
      setWalletSelectOpen(false);
    }
  };

  // Handle mint NFT for fund manager
  const handleMintNFT = async () => {
    if (!isManager || !fund || !connectedAddress) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only the fund manager can mint NFTs.",
      });
      return;
    }

    setIsMintingNFT(true);

    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      const targetChainId = network === 'arbitrum' ? 42161 : 1;

      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const networkParams = network === 'arbitrum' ? {
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io']
          } : {
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
            blockExplorerUrls: ['https://etherscan.io']
          };

          await provider.send('wallet_addEthereumChain', [networkParams]);
        } else if (switchError.code === 4001) {
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
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

      // Get SteleFund contract address
      const networkKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund';
      const steleFundAddress = NETWORK_CONTRACTS[networkKey].STELE_FUND_CONTRACT_ADDRESS;
      
      
      // Convert fundId to number
      const fundIdNumber = parseInt(fundId);
      
      // Create contract instance
      const steleFundContract = new ethers.Contract(steleFundAddress, SteleFundABI.abi, signer);
      
      // Verify the signer address matches connected address
      const signerAddress = await signer.getAddress();
      
      // Estimate gas first (SteleFund.mintManagerNFT only takes fundId)
      let gasEstimate;
      try {
        gasEstimate = await steleFundContract.mintManagerNFT.estimateGas(fundIdNumber);
      } catch (estimateError) {
        console.error('Gas estimation error:', estimateError);
        throw new Error('Failed to estimate gas. Please check if you are the fund manager.');
      }

      // Call mintManagerNFT function with estimated gas + buffer
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // Add 20% buffer
      const tx = await steleFundContract.mintManagerNFT(fundIdNumber, {
        gasLimit: gasLimit
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsMintingNFT(false);
    }
  };

  // Mock fund data as fallback (for properties not in subgraph)
  const mockFund = {
    id: fundId,
    name: `Fund ${fundId}`,
    fundId: fundId,
    manager: fund?.manager || '0x1234567890123456789012345678901234567890',
    investorCount: fund ? parseInt(fund.investorCount) : 15,
    tvl: fund ? parseFloat(fund.amountUSD) : 72000,
    totalValue: fund ? `$${parseFloat(fund.amountUSD).toLocaleString()}` : '$72,000',
    status: 'active',
    network: subgraphNetwork,
    createdAt: fund ? new Date(parseInt(fund.createdAtTimestamp) * 1000) : new Date('2024-01-01'),
    updatedAt: fund ? new Date(parseInt(fund.updatedAtTimestamp) * 1000) : new Date(),
    tokens: fund?.tokensSymbols || ['USDC', 'ETH', 'WBTC'],
    isActive: true,
    investorCounter: fund ? parseInt(fund.investorCount) : 15
  }

  // Mock investors data
  const investors = [
    { id: '1', wallet: '0x1234...5678', value: '$25,000', register: '2 days ago', updated: '1 hour ago' },
    { id: '2', wallet: '0xabcd...efgh', value: '$18,500', register: '5 days ago', updated: '3 hours ago' },
    { id: '3', wallet: '0x9876...5432', value: '$32,000', register: '1 week ago', updated: '2 hours ago' }
  ]
  const isLoadingInvestors = false
  const investorsError = null

  // Get real fund transactions data
  const { data: fundTransactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useFundAllTransactions(
    fundId,
    subgraphNetwork as 'ethereum' | 'arbitrum'
  )

  // Check if connected wallet is the fund manager
  const isManager = useMemo(() => {
    if (!connectedAddress || !fund?.manager) return false;
    return connectedAddress.toLowerCase() === fund.manager.toLowerCase();
  }, [connectedAddress, fund?.manager]);

  // Get fund investable token prices for portfolio calculation
  const { 
    data: tokensWithPrices, 
    getFundTokenPriceBySymbol, 
    getFundTokenInfoBySymbol,
    isLoading: isLoadingTokenPrices 
  } = useFundInvestableTokenPrices(subgraphNetwork as 'ethereum' | 'arbitrum')

  // Calculate portfolio data from fund tokens
  const portfolioData = useMemo(() => {
    if (!fund || !fund.tokensSymbols || !fund.tokensAmount || !tokensWithPrices) {
      return {
        tokens: [],
        totalValue: fund ? parseFloat(fund.amountUSD || '0') : 0,
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
      }
    }

    const tokens = fund.tokensSymbols.map((symbol, index) => {
      // tokensAmount is already formatted as BigDecimal from subgraph
      const actualAmount = parseFloat(fund.tokensAmount?.[index] || '0')
      
      // Get real-time price and token info for fund tokens using dedicated fund price hook
      const tokenInfo = getFundTokenInfoBySymbol ? getFundTokenInfoBySymbol(symbol) : null
      const price = tokenInfo?.price || 0
      const value = actualAmount * price

      return {
        symbol,
        amount: actualAmount,
        value,
        price,
        percentage: 0, // Will be calculated after total
        isRealTime: tokenInfo?.isRealTime || false, // Use isRealTime from token info
        priceLastUpdated: tokenInfo?.priceLastUpdated || null
      }
    }).filter(token => token.amount > 0)

    // Calculate real-time total value from token prices
    const realTimeTotalValue = tokens.reduce((sum, token) => sum + token.value, 0)
    
    // Use real-time calculated value if we have price data, otherwise fallback to subgraph data
    const totalValue = realTimeTotalValue > 0 ? realTimeTotalValue : parseFloat(fund.amountUSD || '0')
    
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
  }, [fund, tokensWithPrices, getFundTokenInfoBySymbol])
  
  // Format transactions for display with full token data
  const transactions = fundTransactions.map(tx => ({
    id: tx.id,
    user: `${tx.user.slice(0, 6)}...${tx.user.slice(-4)}`,
    type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
    value: tx.amount || tx.details,
    time: new Date(tx.timestamp * 1000),
    address: tx.user,
    transactionHash: tx.transactionHash,
    timestamp: tx.timestamp,
    // Token data for all transaction types
    token: tx.token,
    symbol: tx.symbol,
    // Preserve swap data for rendering
    tokenIn: tx.tokenIn,
    tokenOut: tx.tokenOut,
    tokenInSymbol: tx.tokenInSymbol,
    tokenOutSymbol: tx.tokenOutSymbol,
    amountIn: tx.amountIn,
    amountOut: tx.amountOut,
  }))


  // Mock investor data for current user
  const investorData = null
  const isLoadingInvestor = false
  const refetchInvestorData = () => {}

  useEffect(() => {
    setIsClient(true);
    setWalletAddress(connectedAddress);
    setIsMounted(true)
  }, [connectedAddress]);

  // Check if user has joined the fund based on subgraph data
  const hasJoinedFromSubgraph = fundInvestorData?.investor !== undefined && fundInvestorData?.investor !== null;
  const hasInvestedInFund = (hasJoinedLocally || hasJoinedFromSubgraph) && isConnected;
  
  
  const isFundClosed = false
  const shouldShowGetRewards = false

  // Helper functions
  const getExplorerUrl = (chainId: string, hash: string) => {
    if (chainId === '0xa4b1') {
      return `https://arbiscan.io/tx/${hash}`;
    }
    return `https://etherscan.io/tx/${hash}`;
  };
  
  const getExplorerName = (chainId: string) => {
    if (chainId === '0xa4b1') {
      return 'Arbiscan';
    }
    return 'Etherscan';
  };

  // Utility functions
  const formatUserAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw': 
        return 'Withdraw';
      case 'withdrawFee':
        return 'Withdraw Fee';
      case 'depositFee':
        return 'Deposit Fee';
      case 'swap':
        return 'Swap';
      case 'create':
        return 'Create';
      case 'join':
        return 'Join';
      default:
        return type;
    }
  };

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
  };

  const handleNavigateToAccount = () => {
    if (connectedAddress) {
      router.push(`/fund/${subgraphNetwork}/${fundId}/${connectedAddress}`);
    }
  };

  // Handle join button click - show confirmation modal
  const handleJoinClick = () => {
    setShowJoinConfirmModal(true);
  };

  // Handle actual fund join after confirmation
  const handleInvestInFund = async () => {
    setShowJoinConfirmModal(false);
    
    try {
      setIsJoining(true);
      
      if (!connectedAddress || !appKitProvider) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: "destructive",
        });
        return;
      }

      // Get ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(appKitProvider.walletProvider as any);
      
      // Get the target chain ID based on URL network
      const targetChainId = routeNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
      // Check current network and switch if needed
      const currentNetwork = await ethersProvider.getNetwork();
      const currentChainId = '0x' + currentNetwork.chainId.toString(16);
      
      if (currentChainId !== targetChainId) {

        try {
          // Try to switch to the target network
          await window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
          
          toast({
            title: 'Network Switched',
            description: `Switched to ${routeNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'}`,
          });
          
          // Wait a moment for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added to wallet, try to add it
            if (routeNetwork === 'arbitrum') {
              try {
                await window.ethereum?.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xa4b1',
                    chainName: 'Arbitrum One',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                    blockExplorerUrls: ['https://arbiscan.io/'],
                  }],
                });
                
                toast({
                  title: 'Network Added',
                  description: 'Arbitrum network added and switched',
                });
                
              } catch (addError) {
                console.error('Failed to add network:', addError);
                toast({
                  title: 'Network Switch Failed',
                  description: 'Please manually switch to the correct network',
                  variant: "destructive",
                });
                return;
              }
            } else {
              toast({
                title: 'Network Switch Failed',
                description: 'Please manually switch to Ethereum mainnet',
                variant: "destructive",
              });
              return;
            }
          } else {
            console.error('Failed to switch network:', switchError);
            toast({
              title: 'Network Switch Failed',
              description: 'Please manually switch to the correct network',
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      const signer = await ethersProvider.getSigner();
      
      // Get the correct contract address for the URL network (not wallet network)
      const contractAddress = routeNetwork === 'arbitrum' 
        ? NETWORK_CONTRACTS.arbitrum_fund.STELE_FUND_INFO_ADDRESS
        : NETWORK_CONTRACTS.ethereum_fund.STELE_FUND_INFO_ADDRESS;
      
      // Import SteleFundInfo ABI
      const SteleFundInfoABI = (await import('@/app/abis/SteleFundInfo.json')).default;
      
      // Create contract instance
      const fundInfoContract = new ethers.Contract(
        contractAddress,
        SteleFundInfoABI.abi,
        signer
      );
            
      // Call join function with fundId as number
      const tx = await fundInfoContract.join(parseInt(fundId));

      // Wait for transaction confirmation
      await tx.wait();

      // Refresh data
      if (typeof refetchFundInvestorData === 'function') {
        refetchFundInvestorData();
      }

      // Invalidate all related queries to refresh data after successful join (similar to FundAssetSwap)
      setTimeout(async () => {
        if (connectedAddress) {
          const investorId = `${fundId}-${connectedAddress.toUpperCase()}`;

          // Step 1: Invalidate and refetch fund data first (this is the source for fundUserTokens)
          await queryClient.invalidateQueries({ queryKey: ['fund', fundId, subgraphNetwork], refetchType: 'active' });
          await queryClient.refetchQueries({ queryKey: ['fund', fundId, subgraphNetwork] });

          await queryClient.invalidateQueries({ queryKey: ['funds', 50], refetchType: 'active' });

          // Small delay to ensure fund data is updated
          await new Promise(resolve => setTimeout(resolve, 500));

          // Step 2: Invalidate and refetch fundUserTokens (depends on fund data)
          await queryClient.invalidateQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork], refetchType: 'active' });
          await queryClient.refetchQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork] });

          // Step 3: Investor data
          await queryClient.invalidateQueries({ queryKey: ['fundInvestor', investorId, subgraphNetwork], refetchType: 'active' });
          await queryClient.refetchQueries({ queryKey: ['fundInvestor', investorId, subgraphNetwork] });

          await queryClient.invalidateQueries({ queryKey: ['fundInvestors', fundId, subgraphNetwork], refetchType: 'active' });

          // Step 4: Invalidate all other related data
          // Transactions
          await queryClient.invalidateQueries({ queryKey: ['fundTransactions', fundId, subgraphNetwork], refetchType: 'active' });
          await queryClient.invalidateQueries({ queryKey: ['fundAllTransactions', fundId, subgraphNetwork], refetchType: 'active' });

          // Snapshots for charts
          await queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'fundSnapshots' && query.queryKey[1] === fundId,
            refetchType: 'active'
          });
          await queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'fundInvestorSnapshots' && query.queryKey[1] === fundId,
            refetchType: 'active'
          });

          // Share data
          await queryClient.invalidateQueries({ queryKey: ['fundShare', fundId, subgraphNetwork], refetchType: 'active' });
          await queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'investorShare',
            refetchType: 'active'
          });
        }
      }, 3000);

      // Set local joined state to immediately update UI
      setHasJoinedLocally(true);

    } catch (error: any) {
      console.error('Join fund error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
          <div className="text-white text-lg font-medium">Loading fund data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error loading fund data</h3>
          <p className="text-sm">Failed to load fund data</p>
        </div>
      </div>
    )
  }

  if (!data?.fund) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">
          <h3 className="text-lg font-semibold mb-2">Fund not found</h3>
          <p className="text-sm">The fund with ID &quot;{fundId}&quot; could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Two Column Layout - Chart + Tabs on Left, Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_0.8fr] lg:gap-6">
        {/* Left Column: Charts + Tabs */}
        <div className="space-y-6">
          {/* Fund Charts Section */}
          <FundCharts 
            fundId={fundId} 
            network={network as 'ethereum' | 'arbitrum' | null}
            fundData={data}
            tokensWithPrices={tokensWithPrices}
            investButton={isClient ? {
              isClient,
              shouldShowGetRewards,
              hasInvestedInFund,
              isFundClosed,
              isJoining,
              isLoadingFund: isLoading,
              fundData: data,
              isGettingRewards,
              handleInvestInFund,
              handleNavigateToAccount,
              handleGetRewards: () => {},
              t,
              isConnected,
              walletSelectOpen,
              setWalletSelectOpen,
              isConnecting,
              handleConnectWallet
            } : undefined}
          />

          {/* Tabs */}
          <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 md:mr-8">
            <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-8">
              <TabsTrigger
                value="investors"
                className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t('investor')}
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t('transactions')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="investors" className="space-y-0">
              <InvestorsTab 
                challengeId={fundId}
                subgraphNetwork={subgraphNetwork}
                routeNetwork={subgraphNetwork}
                useFundInvestors={useFundInvestors}
                fundData={data}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-0">
              <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading transactions...</span>
                  </div>
                ) : transactionsError ? (
                  <div className="text-center py-8 text-red-400">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Error loading transactions</p>
                    <p className="text-sm text-gray-500 mt-2">Failed to load transactions</p>
                    <p className="text-xs text-gray-500 mt-1">Check console for more details</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <div className="min-w-[400px]">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                              <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('time')}</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('type')}</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                              <th className="text-right py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Calculate pagination
                              const totalTransactions = Math.min(transactions.length, maxPages * itemsPerPage);
                              const startIndex = (currentPage - 1) * itemsPerPage;
                              const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                              const paginatedTransactions = transactions.slice(startIndex, endIndex);

                              return paginatedTransactions.map((transaction, index) => (
                                <tr 
                                  key={transaction.id} 
                                  className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                  onClick={() => {
                                    const chainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
                                    window.open(getExplorerUrl(chainId, transaction.transactionHash), '_blank');
                                  }}
                                >
                                  <td className="py-6 pl-6 pr-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-400">
                                      {formatRelativeTime(transaction.timestamp)}
                                    </div>
                                  </td>
                                  <td className="py-6 px-4 whitespace-nowrap">
                                    <div className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                      {getTransactionTypeText(transaction.type)}
                                    </div>
                                  </td>
                                  <td className="py-6 px-4 whitespace-nowrap">
                                    <div className="text-gray-300 text-sm">
                                      {formatUserAddress(transaction.user)}
                                    </div>
                                  </td>
                                  <td className="py-6 px-6 whitespace-nowrap">
                                    <div className="text-right">
                                      {transaction.type === 'Swap' ? (
                                        <div className="flex items-center gap-2 justify-end min-w-0 flex-wrap md:flex-nowrap">
                                          <div className="flex items-center gap-2 min-w-0">
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
                                            <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                              {transaction.amountIn}
                                            </span>
                                          </div>
                                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                          <div className="flex items-center gap-2 min-w-0">
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
                                            <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                              {transaction.amountOut}
                                            </span>
                                          </div>
                                        </div>
                                      ) : transaction.type === 'Withdraw' ? (
                                        <div className="font-medium text-gray-100">
                                          {transaction.value.startsWith('$') ? transaction.value : `$${transaction.value}`}
                                        </div>
                                      ) : (transaction.type === 'Deposit' || transaction.type === 'Depositfee' || transaction.type === 'Withdrawfee' || transaction.type.toLowerCase() === 'withdrawfee') && transaction.symbol ? (
                                        <div className="flex items-center gap-2 justify-end">
                                          <span className="text-sm md:text-base font-medium text-gray-100 truncate">
                                            {transaction.value}
                                          </span>
                                          <div className="relative flex-shrink-0">
                                            {(() => {
                                              const tokenSymbol = transaction.symbol || ''
                                              const tokenAddress = transaction.token || tokenSymbol
                                              const tokenLogo = getTokenLogo(tokenAddress, subgraphNetwork as 'ethereum' | 'arbitrum')
                                              return tokenLogo ? (
                                                <Image 
                                                  src={tokenLogo} 
                                                  alt={tokenSymbol || 'Token'}
                                                  width={20}
                                                  height={20}
                                                  className="rounded-full"
                                                />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                  {tokenSymbol?.slice(0, 1) || '?'}
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
                                      ) : (
                                        <div className="font-medium text-gray-100">{transaction.value || '-'}</div>
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
                    
                    {/* Pagination - outside scrollable area, fixed at bottom */}
                    {(() => {
                      const totalTransactions = Math.min(transactions.length, maxPages * itemsPerPage);
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
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions found for this fund</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>

        {/* Right Column: Fund Summary + Ranking */}
        <div className="space-y-6">
          {/* PC Action Buttons */}
          <div className="hidden lg:block">
                         {isClient && (
               <div className="space-y-3">
                 {/* Connect Wallet Button */}
                 {!isConnected ? (
                   <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
                     <DialogTrigger asChild>
                       <Button
                         variant="outline"
                         size="lg"
                         className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                       >
                         <Wallet className="mr-3 h-6 w-6" />
                         Connect Wallet
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-md bg-muted/80 border-gray-600">
                       <DialogHeader>
                         <DialogTitle>{t('connectWallet')}</DialogTitle>
                         <DialogDescription>
                           {t('selectWalletToConnect')}
                         </DialogDescription>
                       </DialogHeader>
                       <div className="grid grid-cols-1 gap-4 py-4">
                         <Button
                           variant="outline"
                           size="lg"
                           className="h-16 flex items-center justify-start gap-4 p-4 bg-muted/40 border-gray-600 hover:bg-muted/60"
                           onClick={() => handleConnectWallet()}
                           disabled={isConnecting}
                         >
                           <Image
                             src="/wallets/walletconnect.png"
                             alt="WalletConnect"
                             width={24}
                             height={24}
                             style={{ width: 'auto', height: '24px' }}
                           />
                           <div className="text-left">
                             <div className="font-semibold">WalletConnect</div>
                             <div className="text-sm text-muted-foreground">
                               Mobile & Desktop Wallets
                             </div>
                           </div>
                         </Button>
                       </div>
                       <div className="border-t border-gray-600 pt-4 pb-2">
                         <p className="text-xs text-center text-muted-foreground leading-relaxed">
                           {t('byConnectingWalletPrefix')}{' '}
                           <a
                             href="/terms-of-service"
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                           >
                             {t('termsOfService')}
                           </a>
                           {' '}{t('byConnectingWalletMiddle')}{' '}
                           <a
                             href="/privacy"
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                           >
                             {t('privacyPolicy')}
                           </a>
                           {t('byConnectingWalletSuffix')}
                         </p>
                       </div>
                     </DialogContent>
                   </Dialog>
                ) : hasInvestedInFund ? (
                  <>
                    {/* My Account Button Only for Funds */}
                   <div className={isManager ? "flex gap-3" : ""}>
                     <Button
                       variant="outline"
                       size="lg"
                       onClick={handleNavigateToAccount}
                       className={`${isManager ? "flex-1" : "w-full"} bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg`}
                     >
                       <User className="mr-3 h-6 w-6" />
                       {t('myAccount')}
                     </Button>
                     {isManager && (
                       <Button
                         variant="outline"
                         size="lg"
                         onClick={handleMintNFT}
                         disabled={isMintingNFT}
                         className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                       >
                         {isMintingNFT ? (
                           <>
                             <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                             Minting...
                           </>
                         ) : (
                           <>
                             <ImageIcon className="mr-3 h-6 w-6" />
                             Mint NFT
                           </>
                         )}
                       </Button>
                     )}
                   </div>
                 </>
                ) : !isFundClosed ? (
                   /* Invest Button */
                   <Button 
                     variant="outline" 
                     size="lg" 
                     onClick={handleJoinClick}
                     disabled={isJoining || isLoading || !data?.fund}
                     className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                   >
                     {isJoining ? (
                       <>
                         <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                         Joining...
                       </>
                     ) : isLoading || !data?.fund ? (
                       <>
                         <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                         Loading...
                       </>
                     ) : (
                       <>
                         <Plus className="mr-3 h-6 w-6" />
                         Join
                       </>
                     )}
                   </Button>
                 ) : null}
               </div>
             )}
          </div>
          
          {/* Portfolio Allocation Card */}
          <Card className="bg-transparent border-0 rounded-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Portfolio
              </h3>
              
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
                          {portfolioData.tokens.some(token => token.isRealTime) && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                              <span className="text-xs text-green-400">Live</span>
                            </div>
                          )}
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
              ) : (
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
              )}
            </div>
          </Card>

          {/* Fund Info Card */}
          <Card className="bg-muted/30 border border-gray-700/50 rounded-2xl">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('network')}</span>
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
                  <span className="text-sm text-gray-400">{t('principal')}</span>
                  <span className="text-sm text-white font-medium">
                    ${fund && fund.share
                      ? (parseFloat(fund.share) / Math.pow(10, USDC_DECIMALS)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0.00'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{t('value')}</span>
                    {portfolioData.tokens.some(token => token.isRealTime) && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-green-400 font-medium">
                    ${portfolioData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('profitRatio')}</span>
                  <span className={`text-sm font-medium ${
                    (() => {
                      const principal = fund && fund.share ? parseFloat(fund.share) / Math.pow(10, USDC_DECIMALS) : 0
                      const currentValue = portfolioData.totalValue
                      const profitPercent = principal > 0 ? ((currentValue - principal) / principal) * 100 : 0
                      return profitPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    })()
                  }`}>
                    {(() => {
                      const principal = fund && fund.share ? parseFloat(fund.share) / Math.pow(10, USDC_DECIMALS) : 0
                      const currentValue = portfolioData.totalValue
                      const profitPercent = principal > 0 ? ((currentValue - principal) / principal) * 100 : 0
                      return `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('investor')}</span>
                  <span className="text-sm text-white font-medium">{fund ? fund.investorCount : '0'}</span>
                </div>
                
              </div>
            </div>
          </Card>

        </div>
      </div>
      
      {/* Join Confirmation Modal */}
      <Dialog open={showJoinConfirmModal} onOpenChange={setShowJoinConfirmModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Join Fund
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Are you sure you want to join this fund? This action will register you as an investor in Fund #{fundId}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Fund ID</span>
              <span className="text-white font-medium">#{fundId}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Network</span>
              <span className="text-white font-medium capitalize">{routeNetwork}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Manager</span>
              <span className="text-white font-mono text-sm">
                {fund?.manager ? `${fund.manager.slice(0, 6)}...${fund.manager.slice(-4)}` : 'Unknown'}
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJoinConfirmModal(false)}
              className="flex-1 border-gray-600 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInvestInFund}
              disabled={isJoining}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Confirm Join'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Action Buttons */}
      {isClient && isMounted && createPortal(
        <>
          {isConnected && hasInvestedInFund && (
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
              <div className="p-4">
                <div className={isManager ? "grid grid-cols-2 gap-3" : ""}>
                  {/* My Account Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleNavigateToAccount}
                    className={`${isManager ? "" : "w-full"} bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base`}
                  >
                    <User className="mr-2 h-5 w-5" />
                    {t('myAccount')}
                  </Button>
                  {/* Mint NFT Button for Manager */}
                  {isManager && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleMintNFT}
                      disabled={isMintingNFT}
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                    >
                      {isMintingNFT ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-5 w-5" />
                          Mint NFT
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Join/Connect Button for users who haven't joined */}
          {isClient && !hasInvestedInFund && (
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
              <div className="p-4">
                {!isConnected ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setWalletSelectOpen(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect
                  </Button>
                ) : !isFundClosed && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleJoinClick}
                    disabled={isJoining || isLoading || !data?.fund}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Join
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  )
}