"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowRight, BarChart3, LineChart, PieChart, Loader2, User, Receipt, ArrowLeftRight, Trophy, DollarSign, UserPlus, Plus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ChallengeCharts } from "@/components/challenge-charts"
import { useRouter } from "next/navigation"
import { 
  getChainId,
  getChainConfig, 
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
import { getTokenLogo } from "@/lib/utils"

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
    if (rank <= 3) {
      const emojis = ['🥇', '🥈', '🥉'];
      return <span className="text-3xl">{emojis[rank - 1]}</span>;
    } else if (rank <= 5) {
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24">
            {/* Medal circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill={rank === 4 ? '#4F46E5' : '#10B981'}
              fillOpacity={rank === 4 ? '1' : '0.6'}
              stroke="#FFD700"
              strokeWidth="1"
            />
            {/* Number */}
            <text
              x="12"
              y="13"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {rank}
            </text>
          </svg>
        </div>
      );
    } else {
      return <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    return 'bg-transparent border-gray-700/50 text-gray-100 hover:bg-gray-800/20';
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
      <Card className="bg-transparent border border-gray-700/50">
        <CardContent className="p-6">
          <div className="space-y-3">
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
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(parseInt(rankingData.updatedAtTimestamp) * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {rankingData && totalPages <= 1 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
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
  const [isCreating, setIsCreating] = useState(false);
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
  const { walletType, network } = useWallet();
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

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
  
  // Check if current user has joined this challenge
  const { data: investorData, isLoading: isLoadingInvestor, refetch: refetchInvestorData } = useInvestorData(
    challengeId, 
    walletAddress || "",
    subgraphNetwork
  );

  // Check if user has joined the challenge (combining local state with subgraph data)
  const hasJoinedFromSubgraph = investorData?.investor !== undefined && investorData?.investor !== null;
  const hasJoinedChallenge = hasJoinedLocally || hasJoinedFromSubgraph;

  // Check if current wallet is in top 5 ranking
  const isInTop5Ranking = () => {
    if (!walletAddress || !rankingData?.topUsers || rankingData.topUsers.length === 0) {
      return false;
    }
    
    // Check if current wallet address is in the top 5 users
    const top5Users = rankingData.topUsers.slice(0, 5);
    const isInTop5 = top5Users.some(user => user.toLowerCase() === walletAddress.toLowerCase());  
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
    // If challenge data is not loaded yet, don't show insufficient balance
    if (!challengeData?.challenge || isLoadingChallenge) return false;
    if (!entryFee || !usdcBalance || isLoadingBalance || isLoadingEntryFee) return false;
    
    const balance = parseFloat(usdcBalance);
    const fee = parseFloat(entryFee);
    
    return balance < fee;
  };

  // Check USDC balance
  const checkUSDCBalance = async (address: string) => {
    if (!address || !isClient) return;
    
    setIsLoadingBalance(true);
    try {
      let walletProvider;
      
      // Get the appropriate wallet provider based on connected wallet type
      if (walletType === 'metamask') {
        if (typeof (window as any).ethereum === 'undefined') {
          setUsdcBalance('0');
          return;
        }
        
        // For MetaMask, find the correct provider
        if ((window as any).ethereum.providers) {
          walletProvider = (window as any).ethereum.providers.find((provider: any) => provider.isMetaMask);
        } else if ((window as any).ethereum.isMetaMask) {
          walletProvider = (window as any).ethereum;
        }
        
        if (!walletProvider) {
          setUsdcBalance('0');
          return;
        }
      } else if (walletType === 'phantom') {
        if (typeof window.phantom === 'undefined' || !window.phantom?.ethereum) {
          setUsdcBalance('0');
          return;
        }
        walletProvider = window.phantom.ethereum;
      } else {
        setUsdcBalance('0');
        return;
      }

      // Create a Web3Provider using the current wallet provider
      const provider = new ethers.BrowserProvider(walletProvider);
      
      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      
      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        getUSDCTokenAddress(contractNetwork),
        ERC20ABI.abi,
        provider
      );

      // Get USDC balance
      const balance = await usdcContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, USDC_DECIMALS);
      setUsdcBalance(formattedBalance);
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      setUsdcBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    // Get wallet address from localStorage
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
    // Set client-side flag
    setIsClient(true);
  }, []);

  // Check USDC balance when wallet address changes
  useEffect(() => {
    if (walletAddress && isClient) {
      checkUSDCBalance(walletAddress);
    }
  }, [walletAddress, isClient]);

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
      // If wallet address is not in state, try to get it from current wallet
      if (!walletAddress) {
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

        const accounts = await walletProvider.request({
          method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
        }

        // Save address to state and localStorage
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address);
        
        // Navigate to account page
        router.push(`/challenge/${challengeId}/${address}`);
      } else {
        // Use the existing wallet address
        router.push(`/challenge/${challengeId}/${walletAddress}`);
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

  // Get challenge title and info from real data
  const getChallengeTitle = () => {
    if (challengeData?.challenge) {
      const challengeType = challengeData.challenge.challengeType;
      let baseTitle = '';
      switch(challengeType) {
        case 0:
          baseTitle = `${t('oneWeek')} ${t('challenge')}`;
          break;
        case 1:
          baseTitle = `${t('oneMonth')} ${t('challenge')}`;
          break;
        case 2:
          baseTitle = `${t('threeMonths')} ${t('challenge')}`;
          break;
        case 3:
          baseTitle = `${t('sixMonths')} ${t('challenge')}`;
          break;
        case 4:
          baseTitle = `${t('oneYear')} ${t('challenge')}`;
          break;
        default:
          baseTitle = `Challenge Type ${challengeType}`;
      }
      return `${baseTitle} ( ID: ${challengeId} )`;
    }
    
    // Fallback to old logic if no data
    let baseTitle = '';
    switch(challengeId) {
      case 'one-week-challenge':
        baseTitle = `${t('oneWeek')} ${t('challenge')}`;
        break;
      case 'one-month-challenge':
        baseTitle = `${t('oneMonth')} ${t('challenge')}`;
        break;
      case 'three-month-challenge':
        baseTitle = `${t('threeMonths')} ${t('challenge')}`;
        break;
      case 'six-month-challenge':
        baseTitle = `${t('sixMonths')} ${t('challenge')}`;
        break;
      case 'one-year-challenge':
        baseTitle = `${t('oneYear')} ${t('challenge')}`;
        break;
      default:
        baseTitle = `${t('oneWeek')} ${t('challenge')}`;
    }
    return `${baseTitle} (ID: ${challengeId})`;
  };

  // Get challenge details from real data
  const getChallengeDetails = () => {
    if (!isClient || !challengeData?.challenge) {
      // Return fallback values for SSR and when data is not available
      return {
        participants: 0,
        prize: '$0.00',
        entryFee: '$10.00',
        seedMoney: '$1000.00',
        isActive: false,
        startTime: new Date(),
        endTime: new Date(),
      };
    }
    
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
  };

  const challengeDetails = getChallengeDetails();

  // Handle Join Challenge - Show modal
  const handleJoinChallenge = () => {
    setShowJoinModal(true);
  };

  // Confirm Join Challenge - Actual transaction
  const confirmJoinChallenge = async () => {
    setIsJoining(true);
    setShowJoinModal(false);
    
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

      const userAddress = accounts[0];

      // Get current network information
      const chainId = await walletProvider.request({
        method: 'eth_chainId'
      });
      
      // Use current network without switching
      // No automatic network switching - use whatever network user is currently on

      if (!entryFee) {
        throw new Error("Entry fee not loaded yet. Please try again later.");
      }

      // Create a Web3Provider using the current wallet provider
      const provider = new ethers.BrowserProvider(walletProvider);
      
      // Get the signer
      const signer = await provider.getSigner();
      
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
          queryClient.invalidateQueries({ queryKey: ['investor', challengeId, walletAddress, subgraphNetwork] });
          
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

      // Get current network information
      const chainId = await walletProvider.request({
        method: 'eth_chainId'
      });

      console.log('Current network chain ID for get rewards:', chainId);
      
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
      
      {/* Mobile Responsive Challenge Header */}
      <div className="space-y-4">
        {/* Mobile Layout - Stack vertically */}
        <div className="block md:hidden">
          {/* First row: Challenge title and Entry Fee */}
          <div className="flex items-center justify-between mb-2">
            {isLoadingChallenge ? (
              <div className="h-8 bg-gray-700 rounded w-48 animate-pulse"></div>
            ) : (
              <h2 className="text-2xl">
                <span className="text-gray-400">
                  {getChallengeTitle().split(' ( ID: ')[0]}
                </span>
              </h2>
            )}
          </div>
          
          {/* Second row: Challenge ID and Join Button */}
          <div className="flex items-center justify-between">
            {/* Challenge ID */}
            {!isLoadingChallenge && getChallengeTitle().includes('( ID: ') && (
              <span className="text-gray-100 text-lg">
                {getChallengeTitle().includes('( ID: ') ? '( ID: ' + getChallengeTitle().split('( ID: ')[1] : ''}
              </span>
            )}
            
            {/* Buttons */}
            <div className="flex flex-col space-y-2">
              {/* Get Rewards Button - Show when challenge is ended AND current wallet is in top 5 */}
              {isClient && shouldShowGetRewards() && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleGetRewards}
                  disabled={isGettingRewards}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-yellow-500 hover:border-yellow-400 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                >
                  {isGettingRewards ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-3 h-5 w-5" />
                      Get Rewards
                    </>
                  )}
                </Button>
              )}
              
              {hasJoinedChallenge ? (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleNavigateToAccount}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-gray-500 hover:border-gray-400 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                >
                  <User className="mr-3 h-5 w-5" />
                  {t('myAccount')}
                </Button>
              ) : !isChallengeEnded() && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleJoinChallenge} 
                  disabled={isJoining || isLoadingChallenge || !challengeData?.challenge || isLoadingEntryFee || isLoadingBalance || isInsufficientBalance()}
                  className={`font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg ${
                    isInsufficientBalance() 
                      ? "bg-gray-600 hover:bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                  }`}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t('joining')}
                    </>
                  ) : isLoadingChallenge || !challengeData?.challenge ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Loading challenge info...
                    </>
                  ) : isLoadingEntryFee || isLoadingBalance ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t('loading')}
                    </>
                  ) : isInsufficientBalance() ? (
                    <>
                      <Plus className="mr-3 h-5 w-5" />
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
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Original horizontal layout */}
        <div className="hidden md:flex items-center justify-between">
          {isLoadingChallenge ? (
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          ) : (
            <h2 className="text-2xl">
              <span className="text-gray-400">
                {getChallengeTitle().split(' ( ID: ')[0]}
              </span>
              <span className="text-gray-100">
                {getChallengeTitle().includes('( ID: ') ? ' ( ID: ' + getChallengeTitle().split('( ID: ')[1] : ''}
              </span>
            </h2>
          )}
          <div className="flex items-center gap-2">
            {/* Get Rewards Button - Show when challenge is ended AND current wallet is in top 5 */}
            {isClient && shouldShowGetRewards() && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleGetRewards}
                disabled={isGettingRewards}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-yellow-500 hover:border-yellow-400 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
              >
                {isGettingRewards ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-3 h-5 w-5" />
                    Get Rewards
                  </>
                )}
              </Button>
            )}
            
            {hasJoinedChallenge ? (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleNavigateToAccount}
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-gray-500 hover:border-gray-400 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
              >
                <User className="mr-3 h-5 w-5" />
                {t('myAccount')}
              </Button>
            ) : !isChallengeEnded() && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleJoinChallenge} 
                disabled={isJoining || isLoadingChallenge || !challengeData?.challenge || isLoadingEntryFee || isLoadingBalance || isInsufficientBalance()}
                className={`font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg ${
                  isInsufficientBalance() 
                    ? "bg-gray-600 hover:bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                }`}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {t('joining')}
                  </>
                ) : isLoadingChallenge || !challengeData?.challenge ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Loading challenge info...
                  </>
                ) : isLoadingEntryFee || isLoadingBalance ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {t('loading')}
                  </>
                ) : isInsufficientBalance() ? (
                  <>
                    <Plus className="mr-3 h-5 w-5" />
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
            )}
          </div>
        </div>
      </div>

      {/* Challenge Charts */}
                      <ChallengeCharts challengeId={challengeId} network={subgraphNetwork} />

      {/* Transactions and Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl text-gray-100 mb-6">{t('recentTransactions')}</h2>
          <Card className="bg-transparent border border-gray-700/50">
            <CardContent className="p-6">
              <div className="space-y-4">
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
                  (() => {
                    // Calculate pagination
                    const totalTransactions = Math.min(transactions.length, maxPages * itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                    const paginatedTransactions = transactions.slice(startIndex, endIndex);
                    const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);

                    const getTransactionIcon = (type: string) => {
                      switch (type) {
                        case 'create':
                          return <Trophy className="h-4 w-4 text-white" />
                        case 'join':
                          return <User className="h-4 w-4 text-white" />
                        case 'swap':
                          return <ArrowLeftRight className="h-4 w-4 text-white" />
                        case 'register':
                          return <BarChart3 className="h-4 w-4 text-white" />
                        case 'reward':
                          return <Trophy className="h-4 w-4 text-white" />
                        default:
                          return <Receipt className="h-4 w-4 text-white" />
                      }
                    }

                    const getIconColor = (type: string) => {
                      switch (type) {
                        case 'create':
                          return 'bg-purple-500'
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

                    const formatUserAddress = (address?: string) => {
                      if (!address) return ''
                      return `${address.slice(0, 6)}...${address.slice(-4)}`
                    }

                    return (
                      <div className="space-y-4">
                        {paginatedTransactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between py-3 px-3 last:border-b-0 mb-2 cursor-pointer hover:bg-gray-800/50 rounded-lg transition-colors"
                            onClick={() => {
                              const chainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
                              window.open(getExplorerUrl(chainId, transaction.transactionHash), '_blank');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${getIconColor(transaction.type)} flex items-center justify-center`}>
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-100">
                                  {transaction.type === 'swap' ? 'Swapped' : transaction.details}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {formatTimestamp(transaction.timestamp)}
                                  {transaction.user && ` • ${formatUserAddress(transaction.user)}`}
                                </div>
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
                                          <span className="text-base font-medium text-gray-100">{swapDetails.fromAmount} {swapDetails.fromTokenSymbol}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        <div className="flex items-center gap-2">
                                          <div className="relative">
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
                                          <span className="text-base font-medium text-gray-100">{swapDetails.toAmount} {swapDetails.toTokenSymbol}</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return <div className="font-medium text-gray-100">{transaction.amount || '-'}</div>
                                })()
                              ) : (
                              <div className="font-medium text-gray-100">{transaction.amount || '-'}</div>
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
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions found for this challenge</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Section */}
        <RankingSection challengeId={challengeId} network={subgraphNetwork} />
      </div>

      {/* Join Challenge Confirmation Modal */}
      <AlertDialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to join this challenge?
            </AlertDialogDescription>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
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
            <AlertDialogCancel onClick={() => setShowJoinModal(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmJoinChallenge}
              disabled={isJoining || isLoadingEntryFee || isInsufficientBalance()}
              className="bg-green-600 hover:bg-green-700"
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
