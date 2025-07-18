"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent} from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowRight, Loader2, User, Receipt, ArrowLeftRight, Trophy, DollarSign, UserPlus, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ChallengeCharts } from "@/components/challenge-charts"
import { useRouter } from "next/navigation"
import { 
  getSteleContractAddress,
  getUSDCTokenAddress,
  USDC_DECIMALS
} from "@/lib/constants"
import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import SteleABI from "@/app/abis/Stele.json"
import ERC20ABI from "@/app/abis/ERC20.json"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useTransactions } from "@/app/hooks/useTransactions"
import { useRanking } from "@/app/hooks/useRanking"
import { useInvestorData } from "@/app/subgraph/Account"
import Image from "next/image"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"
import { useAppKitProvider } from '@reown/appkit/react'
import { getTokenLogo } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet } from "lucide-react"

interface ChallengePortfolioProps {
  challengeId: string
}

// Ranking Section Component
function RankingSection({ challengeId, network }: { challengeId: string; network: 'ethereum' | 'arbitrum' | null }) {
  const { t } = useLanguage()
  const router = useRouter();
  const { data: rankingData, isLoading: isLoadingRanking, error: rankingError } = useRanking(challengeId, network);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const formatAddress = (address: string) => {
    // Check if address is empty or zero address
    if (!address || address === '0x0000000000000000000000000000000000000000' || address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return '';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score: string) => {
    try {
      const scoreValue = parseFloat(score);
      return scoreValue.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const formatProfitRatio = (profitRatio: string, userAddress: string) => {
    // Check if address is empty or zero address
    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return '0.0%';
    }
    
    // Convert profit ratio to percentage
    const ratioValue = parseFloat(profitRatio);
    return `${ratioValue.toFixed(4)}%`;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 5) {
      const emojis = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
      return <span className="text-3xl">{emojis[rank - 1]}</span>;
    } else {
      return <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    return 'bg-transparent border-transparent text-gray-100 hover:bg-gray-800/20';
  };

  const handleUserClick = (userAddress: string) => {
    // Check if address is empty or zero address
    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return;
    }
    router.push(`/challenge/${challengeId}/${userAddress}`);
  };

  // Calculate pagination
  const totalUsers = rankingData?.topUsers?.length || 0;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = rankingData?.topUsers?.slice(startIndex, endIndex) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl text-gray-100">Ranking</h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeftRight className="h-4 w-4 rotate-180" />
            </Button>
            <span className="text-sm text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <Card className="bg-transparent border-transparent">
        <CardContent className="p-0">
          <div className="space-y-0">
            {isLoadingRanking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">{t('loadingRankings')}</span>
              </div>
            ) : rankingError ? (
              <div className="text-center py-8 text-red-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">{t('errorLoadingRankings')}</p>
                <p className="text-sm text-gray-500 mt-2">{rankingError.message}</p>
              </div>
            ) : rankingData && rankingData.topUsers.length > 0 ? (
              currentUsers.map((user, index) => {
                const rank = startIndex + index + 1;
                const profitRatio = rankingData.profitRatios[startIndex + index];
                const score = rankingData.scores[startIndex + index];
                const formattedAddress = formatAddress(user);
                const isEmptySlot = !formattedAddress;

                return (
                  <div 
                    key={`${user}-${rank}`} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(rank)} ${
                      isEmptySlot ? 'cursor-default' : 'cursor-pointer transition-colors'
                    }`}
                    onClick={() => !isEmptySlot && handleUserClick(user)}
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(rank)}
                      <div>
                        <div className="font-medium text-white">
                          {isEmptySlot ? (
                            <span className="text-gray-500 italic">Empty</span>
                          ) : (
                            formattedAddress
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-white">${formatScore(score || '0')}</div>
                      <div className={`text-sm font-medium ${
                        parseFloat(profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(profitRatio) >= 0 ? '+' : ''}{formatProfitRatio(profitRatio, user)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noRankingDataFound')}</p>
                <p className="text-sm mt-1">{t('rankingsWillAppear')}</p>
              </div>
            )}
          </div>
          {rankingData && totalPages > 1 && (
            <div className="pb-2">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(parseInt(rankingData.updatedAtTimestamp) * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {rankingData && totalPages <= 1 && (
            <div className="pb-2">
              <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(parseInt(rankingData.updatedAtTimestamp) * 1000).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChallengePortfolio({ challengeId }: ChallengePortfolioProps) {
  const { t } = useLanguage()
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);
  const [isGettingRewards, setIsGettingRewards] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasJoinedLocally, setHasJoinedLocally] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const itemsPerPage = 5;
  const maxPages = 5;
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee();
  
  // Use wallet hook to get current wallet info
  const { address: connectedAddress, isConnected, walletType, network, connectWallet, getProvider } = useWallet();
  
  // Use AppKit provider for WalletConnect
  const { walletProvider: appKitProvider } = useAppKitProvider('eip155');
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

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





  // Get swap details from transaction data
  const getSwapDetails = (transaction: any) => {
    if (transaction.type !== 'swap') return null
    
    // Use the swap data from the transaction
    if (transaction.fromAssetSymbol && transaction.toAssetSymbol) {
      return {
        fromAmount: parseFloat(transaction.fromAmount).toFixed(4),
        fromToken: transaction.fromAsset,
        fromTokenSymbol: transaction.fromAssetSymbol,
        toAmount: parseFloat(transaction.toAmount).toFixed(4),
        toToken: transaction.toAsset,
        toTokenSymbol: transaction.toAssetSymbol
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

  // Check if USDC balance is insufficient
  const isInsufficientBalance = () => {
    // If wallet is not connected, don't show insufficient balance (show connect wallet instead)
    if (!isConnected || !currentWalletAddress) return false;
    
    // If challenge data is not loaded yet, don't show insufficient balance
    if (!challengeData?.challenge || isLoadingChallenge) return false;
    
    // If still loading balance or entry fee, don't show insufficient balance yet
    if (isLoadingBalance || isLoadingEntryFee) return false;
    
    // If entryFee or usdcBalance is not available, don't show insufficient balance
    if (!entryFee || !usdcBalance) return false;
    
    const balance = parseFloat(usdcBalance);
    const fee = parseFloat(entryFee);
    
    // Only show insufficient if we have valid numbers and balance is actually less than fee
    if (isNaN(balance) || isNaN(fee)) return false;
    
    const isInsufficient = balance < fee;    
    return isInsufficient;
  };

  // Check USDC balance
  const checkUSDCBalance = async (address: string) => {
    if (!address || !isClient) return;
    
    setIsLoadingBalance(true);
    try {
      // Use the getProvider from useWallet hook for better reliability
      const browserProvider = getProvider();
      if (!browserProvider) {
        console.warn('No wallet provider available');
        setUsdcBalance('0');
        return;
      }

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      
      // Create USDC contract instance using the provider from useWallet hook
      const usdcContract = new ethers.Contract(
        getUSDCTokenAddress(contractNetwork),
        ERC20ABI.abi,
        browserProvider
      );

      // Get USDC balance for the specified address
      const balance = await usdcContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, USDC_DECIMALS);
      
      console.log(`USDC Balance for ${address}: ${formattedBalance} USDC`);
      setUsdcBalance(formattedBalance);
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      setUsdcBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
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
  useEffect(() => {
    if (!isClient) return;
    
    if (currentWalletAddress && isConnected && walletType) {
      console.log(`Checking USDC balance for wallet: ${currentWalletAddress}, type: ${walletType}, network: ${network}`);
      checkUSDCBalance(currentWalletAddress);
    } else {
      // Clear balance when wallet is not connected
      setUsdcBalance('0');
      setIsLoadingBalance(false);
    }
  }, [currentWalletAddress, isClient, isConnected, walletType, network]);

  // Update time every second for accurate countdown
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Handle navigation to account page
  const handleNavigateToAccount = async () => {
    try {
      // Use connected address first, fallback to stored wallet address
      if (!currentWalletAddress) {
        // WalletConnect only - use getProvider from useWallet hook
        const provider = getProvider();
        if (!provider || walletType !== 'walletconnect') {
          throw new Error("WalletConnect not available. Please connect your wallet first.");
        }

        const accounts = await provider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please connect your wallet first.");
        }

        // Save address to state and localStorage
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address);
        
        // Navigate to account page
        router.push(`/challenge/${challengeId}/${address}`);
      } else {
        // Use the existing wallet address
        router.push(`/challenge/${challengeId}/${currentWalletAddress}`);
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Error Connecting Wallet",
        description: error.message || "An unknown error occurred",
      });
    }
  };

  // Handle Join Challenge - Show modal
  const handleJoinChallenge = () => {
    setShowJoinModal(true);
  };

  // Confirm Join Challenge - Actual transaction
  const confirmJoinChallenge = async () => {
    // Check if wallet is connected
    if (!isConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsJoining(true);
    setShowJoinModal(false);
    
    try {      
      // Get provider using useWallet hook
      const browserProvider = getProvider();
      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
      }

      // Request account access
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
      }

      const userAddress = accounts[0];

      // Get current network information
      const chainId = await browserProvider.send('eth_chainId', []);
      
      // Use current network without switching
      // No automatic network switching - use whatever network user is currently on

      if (!entryFee) {
        throw new Error("Entry fee not loaded yet. Please try again later.");
      }

      // Use existing browserProvider and get signer
      const signer = await browserProvider.getSigner();
      
      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      
      // Create contract instances
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      const usdcContract = new ethers.Contract(
        getUSDCTokenAddress(contractNetwork),
        ERC20ABI.abi,
        signer
      );
      // Convert entryFee from string to the proper format for the contract
      const discountedEntryFeeAmount = ethers.parseUnits(entryFee, USDC_DECIMALS);

      // Check current USDC balance
      try {
        const usdcBalance = await usdcContract.balanceOf(userAddress);        
        if (usdcBalance < discountedEntryFeeAmount) {
          const balanceFormatted = ethers.formatUnits(usdcBalance, USDC_DECIMALS);
          throw new Error(`❌ Insufficient USDC balance. You have ${balanceFormatted} USDC but need ${entryFee} USDC.`);
        }
      } catch (balanceError: any) {
        console.error("❌ Error checking USDC balance:", balanceError);
        throw balanceError;
      }

      // Check current allowance
      try {
        const currentAllowance = await usdcContract.allowance(userAddress, getSteleContractAddress(contractNetwork));
        if (currentAllowance < discountedEntryFeeAmount) {
          
          // Estimate gas for approval
          try {
            const approveGasEstimate = await usdcContract.approve.estimateGas(getSteleContractAddress(contractNetwork), discountedEntryFeeAmount);
            const approveTx = await usdcContract.approve(getSteleContractAddress(contractNetwork), discountedEntryFeeAmount, {
              gasLimit: approveGasEstimate + BigInt(10000) // Add 10k gas buffer
            });
                        
            // Show toast notification for approve transaction submitted
            const explorerName = getExplorerName(chainId);
            const explorerUrl = getExplorerUrl(chainId, approveTx.hash);
            
            toast({
              title: "Approval Submitted",
              description: "Your USDC approval transaction has been sent to the network.",
              action: (
                <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
                  View on {explorerName}
                </ToastAction>
              ),
            });
            
            // Wait for approve transaction to be mined
            await approveTx.wait();
            
            // Show toast notification for approve transaction confirmed
            toast({
              title: "Approval Confirmed",
              description: `You have successfully approved ${entryFee} USDC for Stele contract.`,
              action: (
                <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
                  View on {explorerName}
                </ToastAction>
              ),
            });
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
                
        // Show toast notification for transaction submitted
        const joinExplorerName = getExplorerName(chainId);
        const joinExplorerUrl = getExplorerUrl(chainId, tx.hash);
        
        toast({
          title: "Transaction Submitted",
          description: "Your join challenge transaction has been sent to the network.",
          action: (
            <ToastAction altText={`View on ${joinExplorerName}`} onClick={() => window.open(joinExplorerUrl, '_blank')}>
              {t('view')} on {joinExplorerName}
            </ToastAction>
          ),
        });
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Show toast notification for transaction confirmed
        toast({
          title: t('joinChallenge'),
          description: "You have successfully joined the challenge!",
          action: (
            <ToastAction altText={`View on ${joinExplorerName}`} onClick={() => window.open(joinExplorerUrl, '_blank')}>
              {t('view')} on {joinExplorerName}
            </ToastAction>
          ),
        });

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
      
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to join challenge: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Get Rewards
  const handleGetRewards = async () => {
    setIsGettingRewards(true);
    
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

      // Connect to provider with signer
      const signer = await provider.getSigner()

      // Get current network information
      const chainId = await provider.send('eth_chainId', []);

      console.log('Current network chain ID for get rewards:', chainId);
      
      // Use current network without switching
      // No automatic network switching - use whatever network user is currently on

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call getRewards function
      const tx = await steleContract.getRewards(challengeId);
      
      // Show toast notification for transaction submitted
      const rewardExplorerName = getExplorerName(chainId);
      const rewardExplorerUrl = getExplorerUrl(chainId, tx.hash);
      
      toast({
        title: "Transaction Submitted",
        description: "Your reward claim transaction has been sent to the network.",
        action: (
          <ToastAction altText={`View on ${rewardExplorerName}`} onClick={() => window.open(rewardExplorerUrl, '_blank')}>
            View on {rewardExplorerName}
          </ToastAction>
        ),
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Show toast notification for transaction confirmed
      toast({
        title: "Rewards Claimed!",
        description: "Your challenge rewards have been successfully claimed!",
        action: (
          <ToastAction altText={`View on ${rewardExplorerName}`} onClick={() => window.open(rewardExplorerUrl, '_blank')}>
            View on {rewardExplorerName}
          </ToastAction>
        ),
      });
      
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      
      // Show toast notification for error
      toast({
        variant: "destructive",
        title: "Error Claiming Rewards",
        description: error.message || "An unknown error occurred",
      });
      
    } finally {
      setIsGettingRewards(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Refreshing Spinner Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            <div className="text-white text-lg font-medium">Join request successful!</div>
            <div className="text-gray-300 text-sm">Refreshing data...</div>
          </div>
        </div>
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
              isLoadingBalance,
              isInsufficientBalance: isInsufficientBalance(),
              isGettingRewards,
              handleJoinChallenge,
              handleNavigateToAccount,
              handleGetRewards,
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
          <h2 className="text-3xl text-gray-100 mb-6">{t('transactions')}</h2>
          <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden md:mr-16">
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
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left py-3 px-10 text-sm font-medium text-gray-400">Wallet</th>
                        <th className="text-left py-3 px-20 sm:px-40 text-sm font-medium text-gray-400">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Calculate pagination
                        const totalTransactions = Math.min(transactions.length, maxPages * itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                        const paginatedTransactions = transactions.slice(startIndex, endIndex);
                        const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);

                        return (
                          <>
                            {paginatedTransactions.map((transaction) => (
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
                              <div className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                {getTransactionTypeText(transaction.type)}
                              </div>
                            </td>
                            <td className="py-6 px-4">
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
                                                />
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.toAmount} {swapDetails.toTokenSymbol}</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return <div className="font-medium text-gray-100">{transaction.amount || '-'}</div>
                                })()
                              ) : transaction.type === 'join' || transaction.type === 'register' ? (
                                <div className="font-medium text-gray-100 truncate">{formatUserAddress(transaction.user)}</div>
                              ) : (
                                <div className="font-medium text-gray-100 truncate">{transaction.amount || '-'}</div>
                              )}
                                </div>
                              </td>
                            </tr>
                        ))}
                        
                        {/* Pagination Row */}
                        {totalPages > 1 && (
                          <tr>
                            <td colSpan={4} className="py-6">
                              <div className="flex justify-center">
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
                            </td>
                          </tr>
                        )}
                          </>
                        );
                      })()}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found for this challenge</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
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
                         onClick={handleGetRewards}
                         disabled={isGettingRewards}
                         className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
                       >
                         {isGettingRewards ? (
                           <>
                             <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                             Claiming...
                           </>
                         ) : (
                           <>
                             <DollarSign className="mr-1 h-4 w-4" />
                             Get Rewards
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
                     disabled={isJoining || isLoadingChallenge || !challengeData?.challenge || isLoadingEntryFee || isLoadingBalance || isInsufficientBalance()}
                     className={`w-full font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base ${
                       isInsufficientBalance()
                         ? "bg-red-500 hover:bg-red-500 text-white border-red-500 cursor-not-allowed" 
                         : "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600"
                     }`}
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
                     ) : isLoadingEntryFee || isLoadingBalance ? (
                       <>
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                         {t('loading')}
                       </>
                     ) : isInsufficientBalance() ? (
                       <>
                         <Plus className="mr-2 h-5 w-5" />
                         Insufficient USDC
                       </>
                     ) : (
                       <>
                         <Plus className="mr-2 h-5 w-5" />
                         {t('join')}
                         <UserPlus className="ml-2 h-5 w-5" />
                       </>
                     )}
                   </Button>
                 ) : null}
              </div>
            )}
          </div>

          {/* Challenge Info Card */}
          <Card className="bg-muted border-0 rounded-2xl h-fit">
            <CardContent className="p-8 space-y-10">
              {/* Row 1: Type and Status */}
              <div className="grid grid-cols-2 gap-6">
                {/* Type */}
                <div className="space-y-2">
                  <span className="text-base text-gray-400">{t('type')}</span>
                  <div className="text-3xl text-white">
                    {challengeData?.challenge ? (() => {
                      const challengeType = challengeData.challenge.challengeType;
                      switch(challengeType) {
                        case 0: return t('oneWeek');
                        case 1: return t('oneMonth');
                        case 2: return t('threeMonths');
                        case 3: return t('sixMonths');
                        case 4: return t('oneYear');
                        default: return `Type ${challengeType}`;
                      }
                    })() : t('loading')}
                  </div>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <span className="text-base text-gray-400">{t('status')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                      {subgraphNetwork === 'ethereum' ? (
                        <Image 
                          src="/networks/small/ethereum.png" 
                          alt="Ethereum Mainnet"
                          width={24}
                          height={24}
                          className="rounded-full"
                          style={{ width: '24px', height: '24px' }}
                        />
                      ) : subgraphNetwork === 'arbitrum' ? (
                        <Image 
                          src="/networks/small/arbitrum.png" 
                          alt="Arbitrum One"
                          width={24}
                          height={24}
                          className="rounded-full"
                          style={{ width: '24px', height: '24px' }}
                        />
                      ) : (
                        <Image 
                          src="/networks/small/ethereum.png" 
                          alt="Ethereum Mainnet"
                          width={24}
                          height={24}
                          className="rounded-full"
                          style={{ width: '24px', height: '24px' }}
                        />
                      )}
                    </div>
                    <span className={`text-xl font-medium ${challengeData?.challenge?.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {challengeData?.challenge?.isActive ? t('active') : t('ended')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Total Prize and Users */}
              <div className="grid grid-cols-2 gap-6">
                {/* Total Prize */}
                <div className="space-y-2">
                  <span className="text-base text-gray-400">{t('totalPrize')}</span>
                  <div className="text-4xl text-white">
                    ${challengeData?.challenge ? (() => {
                      const totalPrize = parseInt(challengeData.challenge.rewardAmountUSD);
                      return totalPrize >= 1000000 
                        ? `${(totalPrize / 1000000).toFixed(1)}M` 
                        : totalPrize >= 1000 
                        ? `${(totalPrize / 1000).toFixed(1)}K` 
                        : totalPrize.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                    })() : '0'}
                  </div>
                </div>

                {/* Users */}
                <div className="space-y-2">
                  <span className="text-base text-gray-400">{t('users')}</span>
                  <div className="text-4xl text-white">
                    {challengeData?.challenge ? parseInt(challengeData.challenge.investorCounter).toLocaleString() : '0'}
                  </div>
                </div>
              </div>

              {/* Row 3: Progress */}
              {challengeData?.challenge && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-400">{t('progress')}</span>
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
                  <div className="w-full bg-gray-700 rounded-full h-3">
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
                  
                  {/* Time Info */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Start: {new Date(parseInt(challengeData.challenge.startTime) * 1000).toLocaleDateString()}</span>
                    <span>End: {new Date(parseInt(challengeData.challenge.endTime) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
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
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Entry Fee:</span>
                <span className="text-lg font-bold text-white">
                  ${isLoadingEntryFee ? 'Loading...' : entryFee || '0'} USDC
                </span>
              </div>
              {isInsufficientBalance() && (
                <div className="mt-2 text-sm text-red-400">
                  ⚠️ Insufficient USDC balance to join this challenge
                </div>
              )}
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
              disabled={isJoining || isLoadingEntryFee || isInsufficientBalance()}
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
    </div>
  )
}
