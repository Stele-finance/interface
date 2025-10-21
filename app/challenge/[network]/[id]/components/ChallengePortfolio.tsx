"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent} from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowRight, Loader2, User, Users, Receipt, ArrowLeftRight, Activity, Trophy, DollarSign, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ethers } from "ethers"
import { formatDateWithLocale, formatDateOnly } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ChallengeCharts } from "./ChallengeCharts"
import { useRouter } from "next/navigation"
import { 
  getSteleContractAddress,
  getUSDCTokenAddress,
  getRPCUrl,
  USDC_DECIMALS
} from "@/lib/constants"
import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import SteleABI from "@/app/abis/Stele.json"
import ERC20ABI from "@/app/abis/ERC20.json"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useTransactions } from "../../hooks/useTransactions"
import { useRanking } from "@/app/hooks/useRanking"
import { useInvestorData } from "@/app/hooks/useChallengeInvestorData"
import Image from "next/image"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"
import { useUSDCBalance } from "@/app/hooks/useUSDCBalance"
import { getTokenLogo } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet } from "lucide-react"
import { InvestorsTab } from "./InvestorsTab"
import { RankingSection } from "./RankingSection"

interface ChallengePortfolioProps {
  challengeId: string
  network?: string
}



export function ChallengePortfolio({ challengeId, network }: ChallengePortfolioProps) {
  const { t, language } = useLanguage()
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);
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
  const itemsPerPage = 5;
  const maxPages = 5;
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee();
  
  // Use wallet hook to get current wallet info
  const { address: connectedAddress, isConnected, walletType, network: walletNetwork, connectWallet, getProvider } = useWallet();

  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

  // Get USDC balance using Etherscan API
  const { data: usdcBalance, isLoading: isLoadingUSDCBalance, error: usdcBalanceError } = useUSDCBalance(
    connectedAddress,
    subgraphNetwork
  );

  // Wallet connection modal state
  const [walletSelectOpen, setWalletSelectOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle wallet connection - WalletConnect only
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      await connectWallet() // No parameters needed - WalletConnect only
      setWalletSelectOpen(false)
    } catch (error) {
      console.error("Wallet connection error:", error)
    } finally {
      setIsConnecting(false)
    }
  }

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
  const { data: challengeData, isLoading: isLoadingChallenge, error: challengeError } = useChallenge(challengeId, subgraphNetwork);
  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useTransactions(challengeId, subgraphNetwork);
  const { data: rankingData, isLoading: isLoadingRanking, error: rankingError } = useRanking(challengeId, subgraphNetwork);

  // Set mounted state for Portal
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Handle interactions to close mobile tooltips
  useEffect(() => {
    const closeAllTooltips = () => {
      if (showTypeTooltip || showStatusTooltip) {
        setShowTypeTooltip(false);
        setShowStatusTooltip(false);
        // Clear timers when closing tooltips
        if (typeTooltipTimer) {
          clearTimeout(typeTooltipTimer);
          setTypeTooltipTimer(null);
        }
        if (statusTooltipTimer) {
          clearTimeout(statusTooltipTimer);
          setStatusTooltipTimer(null);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      closeAllTooltips();
    };

    const handleTouchStart = (event: TouchEvent) => {
      closeAllTooltips();
    };

    const handleTouchMove = (event: TouchEvent) => {
      closeAllTooltips();
    };

    const handleScroll = () => {
      closeAllTooltips();
    };

    const handleWheel = () => {
      closeAllTooltips();
    };

    if (showTypeTooltip || showStatusTooltip) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTypeTooltip, showStatusTooltip, typeTooltipTimer, statusTooltipTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typeTooltipTimer) {
        clearTimeout(typeTooltipTimer);
      }
      if (statusTooltipTimer) {
        clearTimeout(statusTooltipTimer);
      }
    };
  }, [typeTooltipTimer, statusTooltipTimer]);

  // Helper function to handle tooltip click for mobile and desktop
  const handleTooltipClick = (
    e: React.MouseEvent,
    tooltipType: 'type' | 'status',
    currentShow: boolean,
    setShow: (show: boolean) => void,
    currentTimer: NodeJS.Timeout | null,
    setTimer: (timer: NodeJS.Timeout | null) => void
  ) => {
    e.stopPropagation();
    
    // Clear existing timer
    if (currentTimer) {
      clearTimeout(currentTimer);
      setTimer(null);
    }
    
    if (!currentShow) {
      // Show tooltip
      setShow(true);
      
      // Auto-close after 2 seconds only for mobile
      if (!window.matchMedia('(hover: hover)').matches) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimer(null);
        }, 2000);
        setTimer(timer);
      }
    } else {
      // Hide tooltip
      setShow(false);
    }
  };

  // Helper function to handle mouse leave for desktop
  const handleMouseLeave = (
    setShow: (show: boolean) => void,
    currentTimer: NodeJS.Timeout | null,
    setTimer: (timer: NodeJS.Timeout | null) => void
  ) => {
    // Only trigger on desktop (devices with hover capability)
    if (window.matchMedia('(hover: hover)').matches) {
      // Clear any existing timer
      if (currentTimer) {
        clearTimeout(currentTimer);
        setTimer(null);
      }
      // Hide tooltip immediately on mouse leave
      setShow(false);
    }
  };

  // Note: Using click-only approach for both desktop and mobile to prevent flickering issues





  // Get swap details from transaction data
  const getSwapDetails = (transaction: any) => {
    if (transaction.type !== 'swap') return null
    
    // Use the swap data from the transaction
    if (transaction.tokenInSymbol && transaction.tokenOutSymbol) {
      return {
        fromAmount: parseFloat(transaction.tokenInAmount).toFixed(4),
        fromToken: transaction.tokenIn,
        fromTokenSymbol: transaction.tokenInSymbol,
        toAmount: parseFloat(transaction.tokenOutAmount).toFixed(4),
        toToken: transaction.tokenOut,
        toTokenSymbol: transaction.tokenOutSymbol
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
        return 'text-pink-400'
      case 'reward':
        return 'text-yellow-400'
      case 'airdrop':
        return 'text-orange-400'
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
      case 'airdrop':
        return t('airdrop')
      default:
        return type
    }
  }

  // Format user address
  const formatUserAddress = (address?: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Use connected address for checking if user has joined the challenge
  const currentWalletAddress = connectedAddress || walletAddress;

  // Check if current user has joined the challenge
  const { data: investorData, isLoading: isLoadingInvestor, refetch: refetchInvestorData } = useInvestorData(
    challengeId, 
    currentWalletAddress || "",
    subgraphNetwork
  );

  // Check if user has joined the challenge (combining local state with subgraph data)
  const hasJoinedFromSubgraph = investorData?.investor !== undefined && investorData?.investor !== null;
  const hasJoinedChallenge = (hasJoinedLocally || hasJoinedFromSubgraph) && isConnected;

  // Check if current wallet is in top 5 ranking
  const isInTop5Ranking = () => {
    if (!currentWalletAddress || !rankingData?.topUsers || rankingData.topUsers.length === 0) {
      return false;
    }
    
    // Check if current wallet address is in the top 5 users
    const top5Users = rankingData.topUsers.slice(0, 5);
    const isInTop5 = top5Users.some(user => user.toLowerCase() === currentWalletAddress.toLowerCase());  
    return isInTop5;
  };

  // Check if challenge has ended
  const isChallengeEnded = () => {
    if (!isClient || !challengeData?.challenge) return false;
    const challenge = challengeData.challenge;
    const endTime = new Date(parseInt(challenge.endTime) * 1000);
    const hasEnded = endTime <= currentTime;
    return hasEnded;
  };

  // Check if Get Rewards button should be shown
  const shouldShowGetRewards = () => {
    const challengeEnded = isChallengeEnded();
    const inTop5 = isInTop5Ranking();
    const isActive = challengeData?.challenge?.isActive === true;
    const shouldShow = challengeEnded && inTop5 && isActive;
    return shouldShow;
  };

  // Check if USDC balance is insufficient (only used in modal now)
  const isInsufficientBalance = () => {
    // USDC balance check is no longer needed for join modal
    return false;
  };



  useEffect(() => {
    // Set client-side flag first
    setIsClient(true);
    
    // Use connected address from useWallet hook, fallback to localStorage only if needed
    if (connectedAddress) {
      setWalletAddress(connectedAddress);
    } else {
      // Only use localStorage if no connected address
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setWalletAddress(storedAddress);
      }
    }
  }, [connectedAddress]);

  // Check USDC balance when wallet address or connection state changes
  // DISABLED: Automatic balance checking to prevent unwanted wallet popups
  // USDC balance checking removed - no longer needed for join modal

  // Update time every second for accurate countdown
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
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

  // Handle navigation to account page
  const handleNavigateToAccount = async () => {
    try {
      // Use connectedAddress from useWallet hook first, fallback to currentWalletAddress
      const addressToUse = connectedAddress || currentWalletAddress;
      
      // If wallet is already connected and we have the address, use it directly
      if (addressToUse && isConnected) {
        router.push(`/challenge/${subgraphNetwork}/${challengeId}/${addressToUse}`);
        return;
      }

      // Get provider - same approach as Fund Create
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      // Try to get address from signer first before requesting accounts
      let userAddress: string | null = null;

      try {
        const signer = await provider.getSigner();
        userAddress = await signer.getAddress();
      } catch (error: any) {
        console.warn('Could not get address from signer, requesting accounts:', error);
        
        // Check if user rejected the request
        if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
          throw new Error("Connection request was rejected by user");
        }
        
        // Only call eth_requestAccounts if we can't get address from signer
        const accounts = await provider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please connect your wallet first.");
        }
        userAddress = accounts[0];
      }

      if (!userAddress) {
        throw new Error('Could not determine user address');
      }

      // Save address to state and localStorage
      setWalletAddress(userAddress);
      localStorage.setItem('walletAddress', userAddress);
      
      // Navigate to account page
      router.push(`/challenge/${subgraphNetwork}/${challengeId}/${userAddress}`);
    } catch (error: any) {
      console.error("Error navigating to account:", error);
      
      // Check if user rejected the request
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        toast({
          variant: "default",
          title: "Request Cancelled",
          description: "Connection request was cancelled by user",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error Navigating to Account",
          description: error.message || "An unknown error occurred",
        });
      }
    }
  };

  // Handle Join Challenge - Show modal
  const handleJoinChallenge = async () => {
    setShowJoinModal(true);
  };

  // Confirm Join Challenge - Actual transaction
  const confirmJoinChallenge = async () => {
    setShowJoinModal(false);
    setIsJoining(true);

    try {
      // Get provider - same approach as Fund Create
      const browserProvider = await getProvider();
      if (!browserProvider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      if (!entryFee) {
        throw new Error("Entry fee not loaded yet. Please try again later.");
      }

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

      // Always switch to the selected network before making the transaction
      const targetChainId = contractNetwork === 'arbitrum' ? 42161 : 1;

      // Try to switch to the selected network
      try {
        await browserProvider.send('wallet_switchEthereumChain', [
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

          await browserProvider.send('wallet_addEthereumChain', [networkConfig]);
        } else if (switchError.code === 4001) {
          // User rejected the network switch
          const networkName = contractNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to join challenge.`);
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
      const userAddress = await signer.getAddress();

      // Create a provider for the network from URL (not from wallet)
      const rpcUrl = getRPCUrl(contractNetwork);
      const networkProvider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Create contract instances
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Create USDC contract with network provider for reading
      const usdcContractRead = new ethers.Contract(
        getUSDCTokenAddress(contractNetwork),
        ERC20ABI.abi,
        networkProvider
      );
      
      // Create USDC contract with signer for transactions
      // Use URL-based network addresses
      const usdcContract = new ethers.Contract(
        getUSDCTokenAddress(contractNetwork),
        ERC20ABI.abi,
        signer
      );
      // Convert entryFee from string to the proper format for the contract
      const discountedEntryFeeAmount = ethers.parseUnits(entryFee, USDC_DECIMALS);

      // Check current USDC balance
      try {        
        // Use the read-only contract with network provider
        const usdcBalance = await usdcContractRead.balanceOf(userAddress);        
        if (usdcBalance < discountedEntryFeeAmount) {
          const balanceFormatted = ethers.formatUnits(usdcBalance, USDC_DECIMALS);
          throw new Error(`❌ Insufficient USDC balance. You have ${balanceFormatted} USDC but need ${entryFee} USDC.`);
        }
      } catch (balanceError: any) {
        console.error("❌ Error checking USDC balance:", balanceError);
        if (balanceError.code === 'BAD_DATA' || balanceError.value === '0x') {
          throw new Error(`Unable to read USDC balance. Please ensure you are connected to the ${contractNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'} network.`);
        }
        throw balanceError;
      }

      // Check current allowance using read-only contract
      try {
        const currentAllowance = await usdcContractRead.allowance(userAddress, getSteleContractAddress(contractNetwork));
        if (currentAllowance < discountedEntryFeeAmount) {
          
          // Estimate gas for approval
          try {
            const approveGasEstimate = await usdcContract.approve.estimateGas(getSteleContractAddress(contractNetwork), discountedEntryFeeAmount);
            const approveTx = await usdcContract.approve(getSteleContractAddress(contractNetwork), discountedEntryFeeAmount, {
              gasLimit: approveGasEstimate + BigInt(10000) // Add 10k gas buffer
            });
                        
            // Show toast notification for approve transaction submitted
            const explorerName = getExplorerName(contractNetwork);
            const explorerUrl = getExplorerUrl(contractNetwork, approveTx.hash);

            // Wait for approve transaction to be mined
            await approveTx.wait();
          } catch (approveError: any) {
            console.error("❌ Approval failed:", approveError);
            throw new Error(`Failed to approve USDC: ${approveError.message}`);
          }
        } else {

        }
      } catch (allowanceError: any) {
        console.error("❌ Error checking allowance:", allowanceError);
        throw allowanceError;
      }

      // Now try to join the challenge
      try {
        // Estimate gas for joinChallenge
        const joinGasEstimate = await steleContract.joinChallenge.estimateGas(challengeId);

        const tx = await steleContract.joinChallenge(challengeId, {
          gasLimit: joinGasEstimate + BigInt(20000) // Add 20k gas buffer
        });

        // Wait for transaction to be mined
        await tx.wait();

        // Update local state immediately for instant UI feedback
        setHasJoinedLocally(true);
        
        // Show refreshing spinner with progress
        setIsRefreshing(true);
        setRefreshProgress(0);
        
        // Animate progress from 0% to 100% over 3 seconds
        const progressInterval = setInterval(() => {
          setRefreshProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + (100 / 30); // Increment by ~3.33% every 100ms
          });
        }, 100);
        
        // After 3 seconds, invalidate queries and hide spinner
        setTimeout(() => {
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['challenge', challengeId, subgraphNetwork] });
          queryClient.invalidateQueries({ queryKey: ['transactions', challengeId, subgraphNetwork] });
          queryClient.invalidateQueries({ queryKey: ['ranking', challengeId, subgraphNetwork] });
          queryClient.invalidateQueries({ queryKey: ['investor', challengeId, currentWalletAddress, subgraphNetwork] });
          
          // Hide spinner
          setIsRefreshing(false);
          setRefreshProgress(0);
        }, 3000);
      } catch (joinError: any) {
        console.error("❌ Join challenge failed:", joinError);
        
        // More specific error handling for join challenge
        if (joinError.message.includes("insufficient funds")) {
          throw new Error("Insufficient ETH for gas fees. Please add ETH to your wallet.");
        } else if (joinError.message.includes("user rejected")) {
          throw new Error("Transaction was rejected by user.");
        } else if (joinError.message.includes("already joined") || joinError.message.includes("AlreadyJoined")) {
          throw new Error("You have already joined this challenge.");
        } else if (joinError.message.includes("missing revert data")) {
          throw new Error(`Contract execution failed. This might be due to:\n- Insufficient USDC balance\n- Challenge not active\n- Already joined\n- Invalid challenge ID\n\nPlease check the console for detailed logs.`);
        } else {
          throw new Error(`Failed to join challenge: ${joinError.message}`);
        }
      }
      
    } catch (error: any) {
      console.error("❌ Error in confirmJoinChallenge:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Get Rewards button click - show confirmation modal
  const handleGetRewardsClick = () => {
    setShowGetRewardsModal(true);
  };

  // Handle actual get rewards after confirmation
  const handleConfirmGetRewards = async () => {
    setShowGetRewardsModal(false);
    setIsGettingRewards(true);
    
    try {
      // Get provider - same approach as Fund Create
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.");
      }

      // Use connected address from useWallet hook first, fallback to currentWalletAddress
      const addressToUse = connectedAddress || currentWalletAddress;

      if (!addressToUse) {
        // Try to get address from signer first before requesting accounts
        let userAddress: string | null = null;

        try {
          const signer = await provider.getSigner();
          userAddress = await signer.getAddress();
        } catch (error: any) {
          console.warn('Could not get address from signer, requesting accounts:', error);
          
          // Check if user rejected the request
          if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
            throw new Error("Connection request was rejected by user");
          }
          
          // Only request accounts if we can't get address from signer
          const accounts = await provider.send('eth_requestAccounts', []);

          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please connect your wallet first.");
          }
          userAddress = accounts[0];
        }
        
        if (!userAddress) {
          throw new Error('Could not determine user address');
        }
        
        // Update wallet address if we had to request it
        setWalletAddress(userAddress);
      }

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

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
          throw new Error(`Please switch to ${networkName} network to claim rewards.`);
        } else {
          throw switchError;
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner()

      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call getRewards function
      const tx = await steleContract.getRewards(challengeId);

      // Wait for transaction to be mined
      await tx.wait();

    } catch (error: any) {
      console.error("Error claiming rewards:", error);
    } finally {
      setIsGettingRewards(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Refreshing Spinner Overlay */}
      {isRefreshing && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            <div className="text-white text-lg font-medium">{t('joinRequestSuccessful')}</div>
            <div className="text-gray-300 text-sm">{t('refreshingData')}</div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Two-Column Layout like Investor Page */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_0.8fr] lg:gap-6">
        {/* Left Column: Charts + Transactions */}
        <div className="space-y-6">
          {/* Challenge Charts */}
          <ChallengeCharts 
            challengeId={challengeId} 
            network={subgraphNetwork} 
            joinButton={{
              isClient,
              shouldShowGetRewards: shouldShowGetRewards(),
              hasJoinedChallenge,
              isChallengeEnded: isChallengeEnded(),
              isJoining,
              isLoadingChallenge,
              challengeData,
              isLoadingEntryFee,
              isGettingRewards,
              entryFee,
              handleJoinChallenge,
              handleNavigateToAccount,
              handleGetRewards: handleGetRewardsClick,
              t,
              // Wallet connection props
              isConnected,
              walletSelectOpen,
              setWalletSelectOpen,
              isConnecting,
              handleConnectWallet
            }}
          />

          {/* Transactions Section */}
          <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 md:mr-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="investors" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
              >
                <Users className="h-4 w-4" />
                {t('investor')}
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
              >
                <Activity className="h-4 w-4" />
                {t('transactions')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="investors" className="space-y-0">
              <InvestorsTab 
                challengeId={challengeId}
                subgraphNetwork={subgraphNetwork}
                routeNetwork={subgraphNetwork}
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
                    <p className="text-sm text-gray-500 mt-2">{transactionsError.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Check console for more details</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <>
                    <div className="rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('time')}</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('type')}</th>
                            <th className="text-left py-3 px-10 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                            <th className="text-left py-3 px-20 sm:px-40 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Calculate pagination
                            const totalTransactions = Math.min(transactions.length, maxPages * itemsPerPage);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                            const paginatedTransactions = transactions.slice(startIndex, endIndex);

                            return paginatedTransactions.map((transaction) => (
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
                                    {transaction.type === 'reward' ? formatUserAddress(transaction.user) : formatUserAddress(transaction.user)}
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
                                                  alt={swapDetails.fromTokenSymbol || 'Token'}
                                                  width={20}
                                                  height={20}
                                                  className="rounded-full"
                                                />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                                  {swapDetails.fromTokenSymbol?.slice(0, 1) || '?'}
                                                </div>
                                              )}
                                                {subgraphNetwork === 'arbitrum' && (
                                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-transparent rounded-full">
                                                    <Image 
                                                      src="/networks/small/arbitrum.png" 
                                                      alt="Arbitrum"
                                                      width={12}
                                                      height={12}
                                                      className="w-full h-full object-contain"
                                                      style={{ width: 'auto', height: 'auto' }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.fromAmount} {swapDetails.fromTokenSymbol}</span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="relative flex-shrink-0">
                                              {toLogo ? (
                                                <Image 
                                                  src={toLogo} 
                                                  alt={swapDetails.toTokenSymbol || 'Token'}
                                                  width={20}
                                                  height={20}
                                                  className="rounded-full"
                                                />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                                  {swapDetails.toTokenSymbol?.slice(0, 1) || '?'}
                                                </div>
                                              )}
                                                {subgraphNetwork === 'arbitrum' && (
                                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-transparent rounded-full">
                                                    <Image 
                                                      src="/networks/small/arbitrum.png" 
                                                      alt="Arbitrum"
                                                      width={12}
                                                      height={12}
                                                      className="w-full h-full object-contain"
                                                      style={{ width: 'auto', height: 'auto' }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.toAmount} {swapDetails.toTokenSymbol}</span>
                                            </div>
                                          </div>
                                        )
                                      }
                                      return <div className="font-medium text-gray-100 whitespace-nowrap">{transaction.amount || '-'}</div>
                                    })()
                                  ) : transaction.type === 'airdrop' ? (
                                    <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                                      <div className="relative flex-shrink-0">
                                        <Image 
                                          src="/tokens/small/stl.png" 
                                          alt="STL Token"
                                          width={20}
                                          height={20}
                                          className="rounded-full"
                                        />
                                        {subgraphNetwork === 'arbitrum' && (
                                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-transparent rounded-full">
                                            <Image 
                                              src="/networks/small/arbitrum.png" 
                                              alt="Arbitrum"
                                              width={12}
                                              height={12}
                                              className="w-full h-full object-contain"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <span className="font-medium text-gray-100 truncate">{transaction.amount || '-'}</span>
                                    </div>
                                  ) : transaction.type === 'join' || transaction.type === 'register' ? (
                                    <div className="font-medium text-gray-100 truncate whitespace-nowrap">{formatUserAddress(transaction.user)}</div>
                                  ) : (
                                    <div className="font-medium text-gray-100 truncate whitespace-nowrap">{transaction.amount || '-'}</div>
                                  )}
                                    </div>
                                  </td>
                                </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination - outside table, fixed at bottom */}
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
                    <p>No transactions found for this challenge</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
           </TabsContent>
         </Tabs>
          </div>
        </div>

        {/* Right Column: Challenge Info + Ranking */}
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
                         className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                       >
                         <Wallet className="mr-2 h-5 w-5" />
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
                     </DialogContent>
                   </Dialog>
                 ) : hasJoinedChallenge ? (
                   /* Get Rewards + My Account Buttons */
                   shouldShowGetRewards() ? (
                     <div className="grid grid-cols-2 gap-3">
                       {/* Get Rewards Button */}
                       <Button 
                         variant="outline" 
                         size="lg" 
                         onClick={handleGetRewardsClick}
                         disabled={isGettingRewards}
                         className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
                       >
                         {isGettingRewards ? (
                           <>
                             <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                             {t('claiming')}
                           </>
                         ) : (
                           <>
                             <DollarSign className="mr-1 h-4 w-4" />
                             {t('getRewards')}
                           </>
                         )}
                       </Button>
                       
                       {/* My Account Button */}
                       <Button 
                         variant="outline" 
                         size="lg" 
                         onClick={handleNavigateToAccount}
                         className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
                       >
                         <User className="mr-1 h-4 w-4" />
                         {t('myAccount')}
                       </Button>
                     </div>
                   ) : (
                     /* My Account Button Only */
                     <Button 
                       variant="outline" 
                       size="lg" 
                       onClick={handleNavigateToAccount}
                       className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                     >
                       <User className="mr-2 h-5 w-5" />
                       {t('myAccount')}
                     </Button>
                   )
                 ) : !isChallengeEnded() ? (
                   /* Join Button */
                   <Button 
                     variant="outline" 
                     size="lg" 
                     onClick={handleJoinChallenge}
                     disabled={isJoining || isLoadingChallenge || !challengeData?.challenge || isLoadingEntryFee}
                     className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                   >
                     {isJoining ? (
                       <>
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                         {t('joining')}
                       </>
                     ) : isLoadingChallenge || !challengeData?.challenge ? (
                       <>
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                         Loading...
                       </>
                     ) : isLoadingEntryFee ? (
                       <>
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                         {t('loading')}
                       </>
                     ) : (
                       <>
                         <Plus className="mr-2 h-5 w-5" />
                         {t('join')} (USDC $10)
                       </>
                     )}
                   </Button>
                 ) : null}
              </div>
            )}
          </div>

          {/* Challenge Info Card */}
          <Card className="bg-muted/30 border border-gray-700/50 rounded-2xl">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">Challenge ID</span>
                  <span className="text-sm text-white font-medium">#{challengeId}</span>
                </div>
                
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
                  <span className="text-sm text-gray-400">{t('status')}</span>
                  <span className={`text-sm font-medium ${
                    (() => {
                      if (!challengeData?.challenge) return 'text-red-400';
                      
                      const challenge = challengeData.challenge;
                      const endTime = new Date(parseInt(challenge.endTime) * 1000);
                      const hasEnded = currentTime >= endTime;
                      
                      if (challenge.isActive && !hasEnded) {
                        return 'text-green-400';
                      } else if (challenge.isActive && hasEnded) {
                        return 'text-orange-400';
                      } else {
                        return 'text-gray-400';
                      }
                    })()
                  }`}>
                    {(() => {
                      if (!challengeData?.challenge) return t('end');
                      
                      const challenge = challengeData.challenge;
                      const endTime = new Date(parseInt(challenge.endTime) * 1000);
                      const hasEnded = currentTime >= endTime;
                      
                      if (challenge.isActive && !hasEnded) {
                        return t('active');
                      } else if (challenge.isActive && hasEnded) {
                        return t('pending');
                      } else {
                        return t('end');
                      }
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('seedMoney')}</span>
                  <span className="text-sm text-white font-medium">
                    {(() => {
                      if (challengeData?.challenge?.seedMoney) {
                        const seedMoneyValue = parseInt(challengeData.challenge.seedMoney);
                        return seedMoneyValue > 0 ? `$${seedMoneyValue.toLocaleString()}` : '$0';
                      }
                      return '$0';
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-400">{t('investor')}</span>
                  <span className="text-sm text-white font-medium">
                    {challengeData?.challenge ? parseInt(challengeData.challenge.investorCounter).toLocaleString() : '0'}
                  </span>
                </div>
                
              </div>
            </div>
          </Card>

          {/* Challenge Type & Progress Card */}
          <Card className="bg-muted/30 border border-gray-700/50 rounded-2xl">
            <div className="p-6">
              {/* Challenge Type & Progress */}
              {challengeData?.challenge && (
                <div className="space-y-3">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg">⏳</span>
                          <span className="text-lg text-gray-400">
                            {(() => {
                              const challengeType = challengeData.challenge.challengeType;
                              switch(challengeType) {
                                case 0: return t('oneWeek');
                                case 1: return t('oneMonth');
                                case 2: return t('threeMonths');
                                case 3: return t('sixMonths');
                                case 4: return t('oneYear');
                                default: return `Type ${challengeType}`;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-medium text-gray-300">
                        {(() => {
                          const startTime = new Date(parseInt(challengeData.challenge.startTime) * 1000);
                          const endTime = new Date(parseInt(challengeData.challenge.endTime) * 1000);
                          const currentTime = new Date();
                          const totalDuration = endTime.getTime() - startTime.getTime();
                          const elapsed = currentTime.getTime() - startTime.getTime();
                          const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                          return Math.round(progress);
                        })()}%
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
                                  
                                  // Auto-close after 2 seconds on mobile
                                  if (!window.matchMedia('(hover: hover)').matches) {
                                    const timer = setTimeout(() => {
                                      setShowMobileTooltip(false);
                                      setTooltipTimer(null);
                                    }, 2000);
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
                                    const startTime = new Date(parseInt(challengeData.challenge.startTime) * 1000);
                                    const endTime = new Date(parseInt(challengeData.challenge.endTime) * 1000);
                                    const currentTime = new Date();
                                    const totalDuration = endTime.getTime() - startTime.getTime();
                                    const elapsed = currentTime.getTime() - startTime.getTime();
                                    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                                    return Math.round(progress);
                                  })()}%` 
                                }}
                              ></div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm font-medium">
                              {(() => {
                                const startTime = new Date(parseInt(challengeData.challenge.startTime) * 1000);
                                const endTime = new Date(parseInt(challengeData.challenge.endTime) * 1000);
                                const currentTime = new Date();
                                const remainingMs = endTime.getTime() - currentTime.getTime();
                                
                                if (remainingMs <= 0) return t('ended');
                                
                                const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                                const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                                
                                if (days > 30) {
                                  const months = Math.floor(days / 30);
                                  const remainingDays = days % 30;
                                  return `${months} ${t('months')} ${remainingDays} ${t('days')}`;
                                }
                                
                                if (days > 0) {
                                  return `${days} ${t('days')} ${hours} ${t('hours')}`;
                                }
                                
                                if (hours > 0) {
                                  return `${hours} ${t('hours')} ${minutes} ${t('minutes')}`;
                                }
                                
                                if (minutes > 0) {
                                  return `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}`;
                                }
                                
                                return `${seconds} ${t('seconds')}`;
                              })()}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {/* Time Info */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatDateOnly(new Date(parseInt(challengeData.challenge.startTime) * 1000), language)}</span>
                    <span>{formatDateOnly(new Date(parseInt(challengeData.challenge.endTime) * 1000), language)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Ranking Section */}
          <RankingSection challengeId={challengeId} network={subgraphNetwork} />
        </div>
      </div>

      {/* Join Challenge Confirmation Modal */}
      <AlertDialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <AlertDialogContent className="bg-muted border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Join Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to join this challenge?
            </AlertDialogDescription>
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Entry Fee:</span>
                <span className="text-lg font-bold text-white">
                  ${isLoadingEntryFee ? 'Loading...' : entryFee || '0'} USDC
                </span>
              </div>
              
              <div className="border-t border-gray-600/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{t('yourUSDCBalance')}:</span>
                  <span className="text-lg font-semibold text-white">
                    {isLoadingUSDCBalance ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : usdcBalanceError ? (
                      <span className="text-yellow-400 text-sm">
                        {usdcBalanceError.message?.includes('API key') ? t('balanceUnavailable') : t('balanceCheckFailed')}
                      </span>
                    ) : (
                      usdcBalance?.formatted || '0.00 USDC'
                    )}
                  </span>
                </div>
                                 {!isLoadingUSDCBalance && !usdcBalanceError && usdcBalance && entryFee && (
                   <div className="mt-2 text-xs text-gray-400">
                     {parseFloat(usdcBalance.balance) >= parseFloat(entryFee || '0') ? (
                       <span className="text-green-400">✓ {t('sufficientBalance')}</span>
                     ) : (
                       <span className="text-red-400">⚠ {t('insufficientBalance')}</span>
                     )}
                   </div>
                 )}
                 {usdcBalanceError && (
                   <div className="mt-2 text-xs text-gray-400">
                     <span className="text-yellow-400">
                       {usdcBalanceError.message?.includes('API key') ? 
                         `⚠ ${t('balanceUnavailable')}` : 
                         `⚠ ${t('balanceCheckFailed')}`
                       }
                     </span>
                   </div>
                 )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowJoinModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmJoinChallenge}
              disabled={isJoining || isLoadingEntryFee}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Confirm Join'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Get Rewards Confirmation Modal */}
      <AlertDialog open={showGetRewardsModal} onOpenChange={setShowGetRewardsModal}>
        <AlertDialogContent className="bg-muted border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('getRewards')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to claim your rewards from this challenge?
            </AlertDialogDescription>
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{t('challenge')}:</span>
                <span className="text-lg font-bold text-white">{challengeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{t('address')}:</span>
                <span className="text-lg font-semibold text-white font-mono">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                </span>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowGetRewardsModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmGetRewards}
              disabled={isGettingRewards}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isGettingRewards ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('claiming')}...
                </>
              ) : (
                t('getRewards')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
