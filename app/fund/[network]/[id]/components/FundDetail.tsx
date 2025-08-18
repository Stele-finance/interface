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
import { FundCharts } from "./FundCharts"
import { useRouter } from "next/navigation"
import { 
  getSteleContractAddress,
  getUSDCTokenAddress,
  getRPCUrl,
  USDC_DECIMALS
} from "@/lib/constants"
// Mock data instead of real hooks
// import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import SteleABI from "@/app/abis/Stele.json"
import ERC20ABI from "@/app/abis/ERC20.json"
// import { useFund } from "@/app/hooks/useFund"
// import { useFundTransactions } from "../../hooks/useFundTransactions"
// import { useFundRanking } from "@/app/hooks/useFundRanking"
// import { useFundInvestorData } from "@/app/hooks/useFundInvestorData"
import Image from "next/image"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"
import { useAppKitProvider } from '@reown/appkit/react'
import { useUSDCBalance } from "@/app/hooks/useUSDCBalance"
import { getTokenLogo } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet } from "lucide-react"
import { InvestorsTab } from "./InvestorsTab"

interface FundDetailProps {
  fundId: string
  network?: string
}



export function FundDetail({ fundId, network }: FundDetailProps) {
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
  
  // Mock entry fee instead of useEntryFee hook
  const entryFee = "10"
  const isLoadingEntryFee = false
  
  // Use wallet hook to get current wallet info
  const { address: connectedAddress, isConnected, walletType, network: walletNetwork, connectWallet, getProvider } = useWallet();
  
  // Use AppKit provider for WalletConnect
  const appKitProvider = useAppKitProvider('eip155');
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';

  // Get USDC balance using hook
  const { data: usdcBalanceData, isLoading: isLoadingUSDCBalance, error: usdcBalanceError } = useUSDCBalance(
    connectedAddress || undefined,
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

  // Mock fund data
  const mockFund = {
    id: fundId,
    name: `Fund ${fundId}`,
    fundId: fundId,
    manager: '0x1234567890123456789012345678901234567890',
    investorCount: 15,
    tvl: 72000,
    totalValue: '$72,000',
    status: 'active',
    network: subgraphNetwork,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    tokens: ['USDC', 'ETH', 'WBTC'],
    isActive: true,
    investorCounter: 15
  }
  
  const data = { fund: mockFund }
  const isLoading = false
  const error = null

  // Mock investors data
  const investors = [
    { id: '1', wallet: '0x1234...5678', value: '$25,000', register: '2 days ago', updated: '1 hour ago' },
    { id: '2', wallet: '0xabcd...efgh', value: '$18,500', register: '5 days ago', updated: '3 hours ago' },
    { id: '3', wallet: '0x9876...5432', value: '$32,000', register: '1 week ago', updated: '2 hours ago' }
  ]
  const isLoadingInvestors = false
  const investorsError = null

  // Mock transactions
  const transactions = [
    { 
      id: '1', 
      timestamp: Date.now() / 1000 - 3600, // 1 hour ago
      type: 'deposit', 
      user: '0x1234567890123456789012345678901234567890',
      amount: '$5,000',
      transactionHash: '0x1234567890abcdef'
    },
    { 
      id: '2', 
      timestamp: Date.now() / 1000 - 86400, // 1 day ago
      type: 'withdraw', 
      user: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      amount: '$2,500',
      transactionHash: '0xabcdef1234567890'
    }
  ]
  const isLoadingTransactions = false
  const transactionsError = null


  // Mock investor data for current user
  const investorData = null
  const isLoadingInvestor = false
  const refetchInvestorData = () => {}

  useEffect(() => {
    setIsClient(true);
    setWalletAddress(connectedAddress);
    setIsMounted(true)
  }, [connectedAddress]);

  // Mock fund state
  const hasInvestedInFund = false
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
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const formatUserAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw': 
        return t('withdraw');
      case 'swap':
        return 'Swap';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const typeMap = {
      'deposit': 'text-green-400',
      'withdraw': 'text-red-400', 
      'swap': 'text-blue-400',
      'default': 'text-gray-400'
    };
    return typeMap[type.toLowerCase()] || typeMap.default;
  };

  // Event handlers
  const handleJoinChallenge = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Mock invest function
    console.log('Investing in fund...');
  };

  const handleGetRewards = async (event: React.MouseEvent) => {
    event.preventDefault();
    // Mock get rewards function
    console.log('Getting rewards...');
  };

  const handleNavigateToAccount = () => {
    if (walletAddress) {
      router.push(`/fund/${subgraphNetwork}/${fundId}/${walletAddress}`);
    }
  };

  const handleInvestInFund = async () => {
    try {
      setIsJoining(true);
      
      if (!connectedAddress || !appKitProvider) {
        toast({
          title: t('error'),
          description: 'Please connect your wallet',
          variant: "destructive",
        });
        return;
      }

      // Mock investment logic
      console.log('Investing in fund...');
      
      toast({
        title: t('success'),
        description: 'Investment successful!',
        action: (
          <ToastAction altText="View transaction">
            View
          </ToastAction>
        ),
      });
    } catch (error: any) {
      console.error('Investment error:', error);
      toast({
        title: t('error'),
        description: `Investment failed: ${error.message}`,
        variant: "destructive",
      });
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
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!data?.fund) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">
          <h3 className="text-lg font-semibold mb-2">Fund not found</h3>
          <p className="text-sm">The fund with ID "{fundId}" could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Two Column Layout - Chart + Tabs on Left, Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_0.8fr] lg:gap-6">
        {/* Left Column: Charts + Tabs */}
        <div className="space-y-8">
          {/* Fund Charts Section */}
          <FundCharts 
            fundId={fundId} 
            network={network as 'ethereum' | 'arbitrum' | null}
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
              handleGetRewards,
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
          <Tabs defaultValue="investors" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/60 border border-gray-700/50">
              <TabsTrigger 
                value="investors" 
                className="data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('investor')}
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
              >
                <Receipt className="w-4 h-4 mr-2" />
                {t('transactions')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="investors" className="space-y-0 mt-6">
              <InvestorsTab 
                challengeId={fundId}
                subgraphNetwork={subgraphNetwork}
                routeNetwork={subgraphNetwork}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-0 mt-6">
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
                                    {formatUserAddress(transaction.user)}
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="text-right">
                                    <div className="font-medium text-gray-100 truncate whitespace-nowrap">{transaction.amount || '-'}</div>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
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
                     </DialogContent>
                   </Dialog>
                 ) : hasInvestedInFund ? (
                   /* Get Rewards + My Account Buttons */
                   shouldShowGetRewards ? (
                     <div className="grid grid-cols-2 gap-3">
                       {/* Get Rewards Button */}
                       <Button 
                         variant="outline" 
                         size="lg" 
                         onClick={handleGetRewards}
                         disabled={isGettingRewards}
                         className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                       >
                         {isGettingRewards ? (
                           <>
                             <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                             {t('claiming')}
                           </>
                         ) : (
                           <>
                             <DollarSign className="mr-2 h-5 w-5" />
                             {t('getRewards')}
                           </>
                         )}
                       </Button>
                       
                       {/* My Account Button */}
                       <Button 
                         variant="outline" 
                         size="lg" 
                         onClick={handleNavigateToAccount}
                         className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-4 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base"
                       >
                         <User className="mr-2 h-5 w-5" />
                         {t('myAccount')}
                       </Button>
                     </div>
                   ) : (
                     /* My Account Button Only */
                     <Button 
                       variant="outline" 
                       size="lg" 
                       onClick={handleNavigateToAccount}
                       className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                     >
                       <User className="mr-3 h-6 w-6" />
                       {t('myAccount')}
                     </Button>
                   )
                 ) : !isFundClosed ? (
                   /* Invest Button */
                   <Button 
                     variant="outline" 
                     size="lg" 
                     onClick={handleInvestInFund}
                     disabled={isJoining || isLoading || !data?.fund}
                     className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                   >
                     {isJoining ? (
                       <>
                         <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                         {t('investing')}
                       </>
                     ) : isLoading || !data?.fund ? (
                       <>
                         <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                         Loading...
                       </>
                     ) : (
                       <>
                         <Plus className="mr-3 h-6 w-6" />
                         {t('invest')}
                       </>
                     )}
                   </Button>
                 ) : null}
               </div>
             )}
          </div>
          
          {/* Fund Summary Card */}
          <Card className="bg-transparent border border-gray-600 rounded-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Fund Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">Fund ID</span>
                  <span className="text-sm text-white font-medium">#{fundId}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('network')}</span>
                  <span className="text-sm text-white font-medium capitalize">{subgraphNetwork}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">TVL</span>
                  <span className="text-sm text-green-400 font-medium">${mockFund.tvl.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">{t('investor')}</span>
                  <span className="text-sm text-white font-medium">{mockFund.investorCount}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="text-sm text-green-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}