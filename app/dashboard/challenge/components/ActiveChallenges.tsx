'use client'

import { ChallengeTypeModal } from "./ChallengeTypeModal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { 
  getSteleContractAddress,
  buildTransactionUrl,
  getExplorerName
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useActiveChallenges } from "../hooks/useActiveChallenges"
import { Users, Wallet, CheckCircle, Clock, Trophy, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"
import { useAppKitProvider } from '@reown/appkit/react'

interface ChallengeCardProps {
  id?: string
  title: string
  type: string
  participants: number
  timeLeft: string
  prize: string
  progress: number
  status: "active" | "pending" | "end"
  startTime: string
  endTime: string
  isCompleted: boolean
  challengeId: string
}

function calculateTimeLeft(startTime: string, endTime: string, currentTime: Date = new Date(), t: any): string {
  const start = new Date(Number(startTime) * 1000)
  const end = new Date(Number(endTime) * 1000)
  const now = currentTime
  
  // If challenge hasn't started yet
  if (now < start) {
    return t('notStarted')
  }
  
  // If challenge has ended
  if (now >= end) {
    return t('ended')
  }
  
  const diff = end.getTime() - now.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (days > 30) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return `${months} ${t('months')} ${remainingDays} ${t('days')}`
  }
  
  if (days > 0) {
    return `${days} ${t('days')} ${hours} ${t('hours')}`
  }
  
  if (hours > 0) {
    return `${hours} ${t('hours')} ${minutes} ${t('minutes')}`
  }
  
  if (minutes > 0) {
    return `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}`
  }
  
  return `${seconds} ${t('seconds')}`
}

function calculateProgress(startTime: string, endTime: string, isCompleted: boolean, currentTime: Date = new Date()): number {
  if (isCompleted) return 100
  
  const start = new Date(Number(startTime) * 1000)
  const end = new Date(Number(endTime) * 1000)
  const now = currentTime
  
  // If challenge hasn't started yet
  if (now < start) {
    return 0
  }
  
  // If challenge has ended
  if (now >= end) {
    return 100
  }
  
  const totalDuration = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  
  const progress = (elapsed / totalDuration) * 100
  
  return Math.min(Math.max(progress, 0), 100)
}

interface ActiveChallengesProps {
  showCreateButton?: boolean;
  activeTab?: 'challenges' | 'tokens';
  setActiveTab?: (tab: 'challenges' | 'tokens') => void;
  selectedNetwork?: 'ethereum' | 'arbitrum';
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void;
}

export function ActiveChallenges({ showCreateButton = true, activeTab, setActiveTab, selectedNetwork = 'ethereum', setSelectedNetwork }: ActiveChallengesProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Use wallet hook to get current wallet info
  const { walletType, network, getProvider, isConnected } = useWallet();
  
  // Use AppKit provider for WalletConnect
  const { walletProvider: appKitProvider } = useAppKitProvider('eip155');
  
  // Use React Query client for better data management
  const queryClient = useQueryClient();
  
  // Use selectedNetwork for data fetching instead of wallet network
  const subgraphNetwork = selectedNetwork;

  const { data } = useActiveChallenges(subgraphNetwork)

  // Translate time left text
  const translateTimeLeft = (timeLeft: string): string => {
    if (timeLeft === "Not started yet") return t('notStarted')
    if (timeLeft === "Ended") return t('ended')
    return timeLeft
  }

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

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);


  // Handle Create Challenge with selected type
  const handleCreateChallenge = async (challengeType: number) => {
    setIsCreating(true);
    
    try {
      // WalletConnect only - use getProvider from useWallet hook
      const provider = getProvider();
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.");
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

      // Get wallet's current network
      const walletChainId = await provider.send('eth_chainId', []);
      const expectedChainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
      // If wallet is on wrong network, switch to the selected network
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
              const networkParams = subgraphNetwork === 'arbitrum' ? {
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
              const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
              throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
            }
          } else if (switchError.code === 4001) {
            // User rejected the switch
            const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Please switch to ${networkName} network to create a challenge.`);
          } else {
            throw switchError;
          }
        }
      }

      // Get signer after ensuring correct network
      const signer = await provider.getSigner()
      
      // Create contract instance with the selected network
      const steleContract = new ethers.Contract(
        getSteleContractAddress(subgraphNetwork),
        SteleABI.abi,
        signer
      );

      // Call createChallenge with the selected challenge type
      const tx = await steleContract.createChallenge(challengeType);
      
      // Show toast notification for transaction submitted
      const explorerName = getExplorerName(subgraphNetwork);
      const submittedTxUrl = buildTransactionUrl(subgraphNetwork, tx.hash);
      
      toast({
        title: "Transaction Submitted",
        description: "Your challenge creation transaction has been sent to the network.",
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(submittedTxUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Show toast notification for transaction confirmed
      const confirmedTxUrl = buildTransactionUrl(subgraphNetwork, tx.hash);
      
      toast({
        title: "Challenge Created",
        description: "Your challenge has been created successfully!",
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(confirmedTxUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      });

      // Start refreshing process
      setIsRefreshing(true);

      // Refresh data after 3 seconds using React Query
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activeChallenges', subgraphNetwork] });
        setIsRefreshing(false);
      }, 3000);
      
    } catch (error: any) {
      console.error("Error creating challenge:", error);
      
      // Check if user rejected the request
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied') || error.message?.includes('Connection request was rejected')) {
        toast({
          variant: "default",
          title: "Request Cancelled",
          description: "Challenge creation was cancelled by user",
        });
      } else {
        // Show toast notification for error
        toast({
          variant: "destructive",
          title: "Error Creating Challenge",
          description: error.message || "An unknown error occurred",
        });
        
        // Re-throw the error to be handled by the modal
        throw error;
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Create default challenge structure when data is not available
  const defaultChallenges: ChallengeCardProps[] = [
    {
      id: "1 week challenge",
      title: t('oneWeek'),
      type: `${t('oneWeek')} challenge`,
      participants: 0,
      timeLeft: t('notStarted'),
      prize: "$0.00",
      progress: 0,
      status: "active",
      startTime: "0",
      endTime: "0",
      isCompleted: false,
      challengeId: ""
    },
    {
      id: "1 month challenge",
      title: t('oneMonth'),
      type: `${t('oneMonth')} challenge`,
      participants: 0,
      timeLeft: t('notStarted'),
      prize: "$0.00",
      progress: 0,
      status: "active",
      startTime: "0",
      endTime: "0",
      isCompleted: false,
      challengeId: ""
    },
    {
      id: "3 months challenge",
      title: t('threeMonths'),
      type: `${t('threeMonths')} challenge`,
      participants: 0,
      timeLeft: t('notStarted'),
      prize: "$0.00",
      progress: 0,
      status: "active",
      startTime: "0",
      endTime: "0",
      isCompleted: false,
      challengeId: ""
    },
    {
      id: "6 months challenge",
      title: t('sixMonths'),
      type: `${t('sixMonths')} challenge`,
      participants: 0,
      timeLeft: t('notStarted'),
      prize: "$0.00",
      progress: 0,
      status: "active",
      startTime: "0",
      endTime: "0",
      isCompleted: false,
      challengeId: ""
    },
    {
      id: "1 year challenge",
      title: t('oneYear'),
      type: `${t('oneYear')} challenge`,
      participants: 0,
      timeLeft: t('notStarted'),
      prize: "$0.00",
      progress: 0,
      status: "active",
      startTime: "0",
      endTime: "0",
      isCompleted: false,
      challengeId: ""
    }
  ];

  // Use actual data if available, otherwise use default challenges
  const challenges: ChallengeCardProps[] = data?.activeChallenges ? [
    {
      id: "one-week-challenge",
      title: t('oneWeek'),
      type: `${t('oneWeek')} challenge`,
      participants: Number(data.activeChallenges.one_week_investorCounter) || 0,
      timeLeft: isClient ? translateTimeLeft(calculateTimeLeft(data.activeChallenges.one_week_startTime, data.activeChallenges.one_week_endTime, currentTime, t)) : t('loading'),
      prize: `$${Number(data.activeChallenges.one_week_rewardAmountUSD).toFixed(2)}`,
      progress: isClient ? calculateProgress(data.activeChallenges.one_week_startTime, data.activeChallenges.one_week_endTime, data.activeChallenges.one_week_isCompleted, currentTime) : 0,
      status: data.activeChallenges.one_week_isCompleted ? "end" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.one_week_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.one_week_startTime,
      endTime: data.activeChallenges.one_week_endTime,
      isCompleted: data.activeChallenges.one_week_isCompleted,
      challengeId: data.activeChallenges.one_week_id || "1"
    },
    {
      id: "one-month-challenge",
      title: t('oneMonth'),
      type: `${t('oneMonth')} challenge`,
      participants: Number(data.activeChallenges.one_month_investorCounter) || 0,
      timeLeft: isClient ? translateTimeLeft(calculateTimeLeft(data.activeChallenges.one_month_startTime, data.activeChallenges.one_month_endTime, currentTime, t)) : t('loading'),
      prize: `$${Number(data.activeChallenges.one_month_rewardAmountUSD).toFixed(2)}`,
      progress: isClient ? calculateProgress(data.activeChallenges.one_month_startTime, data.activeChallenges.one_month_endTime, data.activeChallenges.one_month_isCompleted, currentTime) : 0,
      status: data.activeChallenges.one_month_isCompleted ? "end" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.one_month_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.one_month_startTime,
      endTime: data.activeChallenges.one_month_endTime,
      isCompleted: data.activeChallenges.one_month_isCompleted,
      challengeId: data.activeChallenges.one_month_id || "2"
    },
    {
      id: "three-month-challenge",
      title: t('threeMonths'),
      type: `${t('threeMonths')} challenge`,
      participants: Number(data.activeChallenges.three_month_investorCounter) || 0,
      timeLeft: isClient ? translateTimeLeft(calculateTimeLeft(data.activeChallenges.three_month_startTime, data.activeChallenges.three_month_endTime, currentTime, t)) : t('loading'),
      prize: `$${Number(data.activeChallenges.three_month_rewardAmountUSD).toFixed(2)}`,
      progress: isClient ? calculateProgress(data.activeChallenges.three_month_startTime, data.activeChallenges.three_month_endTime, data.activeChallenges.three_month_isCompleted, currentTime) : 0,
      status: data.activeChallenges.three_month_isCompleted ? "end" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.three_month_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.three_month_startTime,
      endTime: data.activeChallenges.three_month_endTime,
      isCompleted: data.activeChallenges.three_month_isCompleted,
      challengeId: data.activeChallenges.three_month_id || "3"
    },
    {
      id: "six-month-challenge",
      title: t('sixMonths'),
      type: `${t('sixMonths')} challenge`,
      participants: Number(data.activeChallenges.six_month_investorCounter) || 0,
      timeLeft: isClient ? translateTimeLeft(calculateTimeLeft(data.activeChallenges.six_month_startTime, data.activeChallenges.six_month_endTime, currentTime, t)) : t('loading'),
      prize: `$${Number(data.activeChallenges.six_month_rewardAmountUSD).toFixed(2)}`,
      progress: isClient ? calculateProgress(data.activeChallenges.six_month_startTime, data.activeChallenges.six_month_endTime, data.activeChallenges.six_month_isCompleted, currentTime) : 0,
      status: data.activeChallenges.six_month_isCompleted ? "end" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.six_month_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.six_month_startTime,
      endTime: data.activeChallenges.six_month_endTime,
      isCompleted: data.activeChallenges.six_month_isCompleted,
      challengeId: data.activeChallenges.six_month_id || "4"
    },
    {
      id: "one-year-challenge",
      title: t('oneYear'),
      type: `${t('oneYear')} challenge`,
      participants: Number(data.activeChallenges.one_year_investorCounter) || 0,
      timeLeft: isClient ? translateTimeLeft(calculateTimeLeft(data.activeChallenges.one_year_startTime, data.activeChallenges.one_year_endTime, currentTime, t)) : t('loading'),
      prize: `$${Number(data.activeChallenges.one_year_rewardAmountUSD).toFixed(2)}`,
      progress: isClient ? calculateProgress(data.activeChallenges.one_year_startTime, data.activeChallenges.one_year_endTime, data.activeChallenges.one_year_isCompleted, currentTime) : 0,
      status: data.activeChallenges.one_year_isCompleted ? "end" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.one_year_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.one_year_startTime,
      endTime: data.activeChallenges.one_year_endTime,
      isCompleted: data.activeChallenges.one_year_isCompleted,
      challengeId: data.activeChallenges.one_year_id || "5"
    }
  ] : defaultChallenges;

  const getStatusBadge = (status: "active" | "pending" | "end") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-green-600/20 focus:bg-green-600/20 transition-none">
            <Clock className="h-4 w-4" />
            {t('active')}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-orange-500/20 focus:bg-orange-500/20 transition-none">
            <Clock className="h-4 w-4" />
            {t('pending')}
          </Badge>
        );
      case "end":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-gray-500/20 focus:bg-gray-500/20 transition-none">
            <CheckCircle className="h-3 w-3" />
            {t('end')}
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="px-3 py-1.5 text-sm whitespace-nowrap pointer-events-none hover:bg-secondary focus:bg-secondary transition-none">{t('unknown')}</Badge>
    }
  }

  // Get challenge type number from challenge title
  const getChallengeTypeFromTitle = (title: string): number => {
    switch (title) {
      case t('oneWeek'):
        return 0;
      case t('oneMonth'):
        return 1;
      case t('threeMonths'):
        return 2;
      case t('sixMonths'):
        return 3;
      case t('oneYear'):
        return 4;
      default:
        return 0;
    }
  };

  // Prepare active challenges data for the modal
  const activeChallengesData = challenges.map(challenge => ({
    challengeType: getChallengeTypeFromTitle(challenge.title),
    status: challenge.status
  }));

  return (
    <>
      {/* Refreshing Spinner Overlay */}
      {isRefreshing && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            <div className="text-white text-lg font-medium">{t('challengeCreatedSuccessfully')}</div>
            <div className="text-gray-300 text-sm">{t('refreshingData')}</div>
          </div>
        </div>,
        document.body
      )}

      <div className="space-y-4 mt-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex gap-4">
            <h2 className="text-3xl text-gray-100 cursor-default">{t('activeChallenges')}</h2>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('tokens')}
                className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
              >
                {t('token')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Network Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="p-3 bg-transparent border-gray-600 hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    {selectedNetwork === 'arbitrum' ? (
                      <Image
                        src="/networks/small/arbitrum.png"
                        alt="Arbitrum"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/networks/small/ethereum.png"
                        alt="Ethereum"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted/80 border-gray-600">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('ethereum')}
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('arbitrum')}
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Challenge Button */}
            {isConnected && (
              <ChallengeTypeModal 
                onCreateChallenge={handleCreateChallenge}
                isCreating={isCreating}
                activeChallenges={activeChallengesData}
              />
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Title and Tab */}
          <div className="flex gap-4">
            <h2 className="text-3xl text-gray-100 cursor-default">{t('activeChallenges')}</h2>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('tokens')}
                className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
              >
                {t('token')}
              </button>
            )}
          </div>
          
          {/* Network Dropdown and New Button */}
          <div className="flex items-center gap-3">
            {/* Network Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="p-3 bg-transparent border-gray-600 hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    {selectedNetwork === 'arbitrum' ? (
                      <Image
                        src="/networks/small/arbitrum.png"
                        alt="Arbitrum"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/networks/small/ethereum.png"
                        alt="Ethereum"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted/80 border-gray-600">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('ethereum')}
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('arbitrum')}
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Challenge Button */}
            {isConnected && (
              <ChallengeTypeModal 
                onCreateChallenge={handleCreateChallenge}
                isCreating={isCreating}
                activeChallenges={activeChallengesData}
              />
            )}
          </div>
        </div>
        <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="rounded-2xl overflow-hidden bg-muted hover:bg-muted/80 border-b border-gray-600">
                    <TableHead className="text-gray-300 pl-6 min-w-[120px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏰</span>
                        {t('period')}
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-300 min-w-[100px] whitespace-nowrap">{t('status')}</TableHead>
                    <TableHead className="text-gray-300 min-w-[120px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⌛</span>
                        {t('progress')}
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap">{t('prize')}</TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap">{t('users')}</TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] pr-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          {/* Show network icon only when connected to Arbitrum */}
                          {selectedNetwork === 'arbitrum' && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                              <Image 
                                src="/networks/small/arbitrum.png" 
                                alt="Arbitrum"
                                width={8}
                                height={8}
                                className="rounded-full"
                                style={{ width: 'auto', height: 'auto' }}
                              />
                            </div>
                          )}
                        </div>
                        {t('challenge')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => (
                    <TableRow 
                      key={challenge.id}
                      className={`border-0 transition-colors ${
                        challenge.challengeId && challenge.challengeId !== "" 
                          ? "hover:bg-gray-800/50 cursor-pointer" 
                          : "cursor-default"
                      }`}
                      onClick={() => {
                        if (challenge.challengeId && challenge.challengeId !== "") {
                          router.push(`/challenge/${selectedNetwork}/${challenge.challengeId}`)
                        }
                      }}
                    >
                      <TableCell className="font-medium text-gray-100 pl-6 py-6 text-lg min-w-[120px] whitespace-nowrap">
                        <span className="whitespace-nowrap">{challenge.title}</span>
                      </TableCell>
                      <TableCell className="py-6 min-w-[100px]">
                        {getStatusBadge(challenge.status)}
                      </TableCell>
                      <TableCell className="py-6 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Progress 
                                    value={challenge.progress} 
                                    className="w-20 h-3"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{challenge.timeLeft}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-sm text-gray-400 font-medium whitespace-nowrap">{Math.round(challenge.progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-yellow-400 py-6 text-lg min-w-[80px] whitespace-nowrap">
                        {challenge.prize}
                      </TableCell>
                      <TableCell className="py-6 min-w-[80px]">
                        <div className="flex items-center gap-2 text-gray-300 text-base whitespace-nowrap">
                          <Users className="h-4 w-4" />
                          <span>{challenge.participants}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 py-6 min-w-[80px]">
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap">
                          {challenge.challengeId}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
