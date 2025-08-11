'use client'

import { ChallengeTypeModal } from "./ChallengeTypeModal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Users, Clock, Trophy, Wallet, CheckCircle } from "lucide-react"
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
}

export function ActiveChallenges({ showCreateButton = true }: ActiveChallengesProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletSelectOpen, setWalletSelectOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Use wallet hook to get current wallet info
  const { walletType, network, getProvider, isConnected, connectWallet } = useWallet();
  
  // Use AppKit provider for WalletConnect
  const { walletProvider: appKitProvider } = useAppKitProvider('eip155');
  
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

  // Handle Connect Wallet
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setWalletSelectOpen(false);
    
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

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

      // Connect to provider with signer
      const signer = await provider.getSigner()
      
      // Create contract instance
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
        )
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-orange-500/20 focus:bg-orange-500/20 transition-none">
            <Clock className="h-4 w-4" />
            {t('pending')}
          </Badge>
        )
      case "end":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-gray-500/20 focus:bg-gray-500/20 transition-none">
            <CheckCircle className="h-3 w-3" />
            {t('end')}
          </Badge>
        )
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
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-gray-100">{t('activeChallenges')}</h2>
          {isConnected ? (
            <ChallengeTypeModal 
              onCreateChallenge={handleCreateChallenge}
              isCreating={isCreating}
              activeChallenges={activeChallengesData}
            />
          ) : (
            <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                  onClick={() => setWalletSelectOpen(true)}
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  {t('connectWallet')}
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
          )}
        </div>

      <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="rounded-2xl overflow-hidden bg-muted hover:bg-muted/80 border-b border-gray-600">
                  <TableHead className="text-gray-300 pl-6 min-w-[120px] whitespace-nowrap">{t('period')}</TableHead>
                  <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap">{t('prize')}</TableHead>
                  <TableHead className="text-gray-300 min-w-[100px] whitespace-nowrap">{t('status')}</TableHead>
                  <TableHead className="text-gray-300 min-w-[120px] whitespace-nowrap">{t('progress')}</TableHead>
                  <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap">{t('users')}</TableHead>
                  <TableHead className="text-gray-300 min-w-[80px] pr-6 whitespace-nowrap">{t('challenge')}</TableHead>
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
                        router.push(`/${network}/challenge/${challenge.challengeId}`)
                      }
                    }}
                  >
                    <TableCell className="font-medium text-gray-100 pl-6 py-6 text-lg min-w-[120px] whitespace-nowrap">
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
                                style={{ width: 'auto', height: 'auto' }}
                              />
                            </div>
                          )}
                        </div>
                        <span className="whitespace-nowrap">{challenge.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-yellow-400 py-6 text-lg min-w-[80px] whitespace-nowrap">
                      {challenge.prize}
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
