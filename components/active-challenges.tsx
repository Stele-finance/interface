'use client'

import { ChallengeCard } from "@/components/challenge-card"
import { ChallengeTypeModal } from "@/components/challenge-type-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { 
  getChainId,
  getChainConfig, 
  getSteleContractAddress
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useActiveChallenges } from "@/app/hooks/useActiveChallenges"
import { ExternalLink, Users, Clock, Trophy, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"

interface ChallengeCardProps {
  id?: string
  title: string
  type: string
  participants: number
  timeLeft: string
  prize: string
  progress: number
  status: "active" | "pending" | "finished"
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
}

export function ActiveChallenges({ showCreateButton = true }: ActiveChallengesProps) {
  const { t } = useLanguage()
  const [isCreating, setIsCreating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use wallet hook to get current wallet info
  const { walletType, network } = useWallet();
  
  // Use React Query client for better data management
  const queryClient = useQueryClient();
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

  const { data } = useActiveChallenges(subgraphNetwork)

  // Translate time left text
  const translateTimeLeft = (timeLeft: string): string => {
    if (timeLeft === "Not started yet") return t('notStarted')
    if (timeLeft === "Ended") return t('ended')
    return timeLeft
  }

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

      // Check if we are on correct network
      const chainId = await walletProvider.request({
        method: 'eth_chainId'
      });

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      const targetChainId = getChainId(contractNetwork);
      
      if (chainId !== targetChainId) {
        // Switch to target network
        try {
          await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to the wallet
          if (switchError.code === 4902) {
            await walletProvider.request({
              method: 'wallet_addEthereumChain',
              params: [getChainConfig(contractNetwork)],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create a Web3Provider using the current wallet provider
      const provider = new ethers.BrowserProvider(walletProvider);
      
      // Get the signer
      const signer = await provider.getSigner();
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Call createChallenge with the selected challenge type
      const tx = await steleContract.createChallenge(challengeType);
      
      // Show toast notification for transaction submitted
      toast({
        title: "Transaction Submitted",
        description: "Your challenge creation transaction has been sent to the network.",
        action: (
          <ToastAction altText="View on BaseScan" onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}>
            View on BaseScan
          </ToastAction>
        ),
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Show toast notification for transaction confirmed
      toast({
        title: "Challenge Created",
        description: "Your challenge has been created successfully!",
        action: (
          <ToastAction altText="View on BaseScan" onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}>
            View on BaseScan
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
      
      // Show toast notification for error
      toast({
        variant: "destructive",
        title: "Error Creating Challenge",
        description: error.message || "An unknown error occurred",
      });
      
      // Re-throw the error to be handled by the modal
      throw error;
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
      status: data.activeChallenges.one_week_isCompleted ? "finished" : 
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
      status: data.activeChallenges.one_month_isCompleted ? "finished" : 
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
      status: data.activeChallenges.three_month_isCompleted ? "finished" : 
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
      status: data.activeChallenges.six_month_isCompleted ? "finished" : 
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
      status: data.activeChallenges.one_year_isCompleted ? "finished" : 
              isClient && currentTime > new Date(Number(data.activeChallenges.one_year_endTime) * 1000) ? "pending" : "active",
      startTime: data.activeChallenges.one_year_startTime,
      endTime: data.activeChallenges.one_year_endTime,
      isCompleted: data.activeChallenges.one_year_isCompleted,
      challengeId: data.activeChallenges.one_year_id || "5"
    }
  ] : defaultChallenges;

  const getStatusBadge = (status: "active" | "pending" | "finished") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm">
            <Clock className="h-4 w-4" />
            {t('active')}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm">
            <Clock className="h-4 w-4" />
            {t('pending')}
          </Badge>
        )
      case "finished":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm">
            <Trophy className="h-4 w-4" />
            {t('finished')}
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="px-3 py-1.5 text-sm">{t('unknown')}</Badge>
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
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            <div className="text-white text-lg font-medium">Challenge created successfully!</div>
            <div className="text-gray-300 text-sm">Refreshing data...</div>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-gray-100">{t('activeChallenges')}</h2>
          <ChallengeTypeModal 
            onCreateChallenge={handleCreateChallenge}
            isCreating={isCreating}
            activeChallenges={activeChallengesData}
          />
        </div>

      <Card className="bg-transparent border border-gray-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-700 bg-gray-900/80 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300 pl-6 w-40 whitespace-nowrap">{t('type')}</TableHead>
                  <TableHead className="text-gray-300 w-20">{t('challenge')}</TableHead>
                  <TableHead className="text-gray-300 w-24">{t('users')}</TableHead>
                  <TableHead className="text-gray-300 w-24">{t('prize')}</TableHead>
                  <TableHead className="text-gray-300 w-32">{t('progress')}</TableHead>
                  <TableHead className="text-gray-300 w-28 pr-6">{t('status')}</TableHead>
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
                        window.location.href = `/challenge/${challenge.challengeId}`
                      }
                    }}
                  >
                    <TableCell className="font-medium text-gray-100 pl-6 py-6 text-lg w-40 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                          {/* Show Arbitrum network icon only when connected to Arbitrum */}
                          {network === 'arbitrum' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                              <Image 
                                src="/networks/small/arbitrum.png" 
                                alt="Arbitrum"
                                width={12}
                                height={12}
                                className="rounded-full"
                                style={{ width: '12px', height: '12px' }}
                              />
                            </div>
                          )}
                        </div>
                        {challenge.title}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm">
                        {challenge.challengeId}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2 text-gray-300 text-base">
                        <Users className="h-4 w-4" />
                        <span>{challenge.participants}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-yellow-400 py-6 text-lg">
                      {challenge.prize}
                    </TableCell>
                    <TableCell className="py-6">
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
                        <span className="text-sm text-gray-400 font-medium">{Math.round(challenge.progress)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-6">
                      {getStatusBadge(challenge.status)}
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
