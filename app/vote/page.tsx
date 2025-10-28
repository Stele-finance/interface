'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePageType } from "@/lib/page-type-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Plus, Loader2, ChevronDown } from "lucide-react"
import { useMultipleProposalVoteResults, useProposalsByStatusPaginated, useProposalsCountByStatus } from "./hooks/useProposals"
import { useQueryClient } from '@tanstack/react-query'
import { getRPCUrl } from "@/lib/constants"
import { ethers } from "ethers"
import { useGovernanceConfig } from "./hooks/useGovernanceConfig"
import { useBlockNumber } from "@/app/hooks/useBlockNumber"
import { useWalletTokenInfo } from "./hooks/useWalletTokenInfo"
import { useWallet } from "@/app/hooks/useWallet"
import { toast } from "@/components/ui/use-toast"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import Image from "next/image"

// Import separated components and utilities
import {
  Proposal,
  BlockInfo,
  ProposalTable,
  PaginationComponent,
  WalletTokenInfo as WalletTokenInfoComponent
} from "./components"
import {
  processStatusBasedProposalData,
  formatDate,
  createProposalUrl,
  handleDelegate
} from "./utils"
import { getTotalPages } from "./utils/pagination"

export default function VotePage() {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const { pageType } = usePageType()
  const router = useRouter()
  
  // Get page type from localStorage to determine redirect
  useEffect(() => {
    const savedPageType = localStorage.getItem('selected-page-type')
    if (savedPageType === 'fund') {
      router.replace('/vote/fund')
    } else {
      router.replace('/vote/challenge')
    }
  }, [router])
  // Use global wallet hook instead of local state
  const { address, isConnected, walletType, getProvider } = useWallet()
  const walletAddress = address ?? undefined
  const queryClient = useQueryClient()
  const [isDelegating, setIsDelegating] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([])
  const [completedProposals, setCompletedProposals] = useState<Proposal[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [mountTimestamp, setMountTimestamp] = useState(Date.now())
  
  // Independent network selection state (not based on wallet)
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Handle click outside for network dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [])

  // Save network selection to localStorage when it changes
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
  }
  
  // Use selected network for all queries
  const subgraphNetwork = selectedNetwork
  
  // Fetch governance configuration from smart contract (temporarily disabled to prevent rate limiting)
  const { config: governanceConfig, isLoading: isLoadingGovernanceConfig, error: governanceConfigError } = useGovernanceConfig(subgraphNetwork, false, pageType)
  
  // Debug: Log governance config when it loads
  useEffect(() => {
    if (governanceConfig && !isLoadingGovernanceConfig) {
      //console.log(`Governance config loaded for ${subgraphNetwork}:`, governanceConfig)
    }
    if (governanceConfigError) {
      console.error(`Failed to load governance config for ${subgraphNetwork}:`, governanceConfigError)
    }
  }, [governanceConfig, isLoadingGovernanceConfig, governanceConfigError, subgraphNetwork])
  
  // Get current block number with global caching
  const { data: blockInfo, isLoading: isLoadingBlockNumber } = useBlockNumber()

  // Get wallet token info with global caching (use network-specific token and page type)
  const { data: walletTokenInfo, isLoading: isLoadingWalletTokenInfo, refetch: refetchWalletTokenInfo } = useWalletTokenInfo(address, selectedNetwork, pageType)

  // State for current block info (for timestamp calculation)
  const [currentBlockInfo, setCurrentBlockInfo] = useState<BlockInfo | null>(null)
  const [isLoadingBlockInfo, setIsLoadingBlockInfo] = useState(false)
  
  // State for tracking recently created proposal
  const [recentlyCreatedProposal, setRecentlyCreatedProposal] = useState<any>(null)
  
  // Pagination state for each tab
  const [activeProposalsPage, setActiveProposalsPage] = useState(1)
  const [completedProposalsPage, setCompletedProposalsPage] = useState(1)
  const [allProposalsPage, setAllProposalsPage] = useState(1)
  const [currentTab, setCurrentTab] = useState("active")
  const ITEMS_PER_PAGE = 10

  // Only fetch data for the current tab to avoid too many simultaneous requests
  const shouldFetchActive = currentTab === "active"
  const shouldFetchCompleted = currentTab === "completed"
  const shouldFetchAll = currentTab === "all"

  // Define status arrays to prevent empty arrays
  const activeStatuses = ['PENDING', 'ACTIVE', 'QUEUED', 'EXECUTED']
  const completedStatuses = ['EXECUTED']
  const allStatuses = ['PENDING', 'ACTIVE', 'QUEUED', 'EXECUTED', 'CANCELED']

  // Fetch paginated proposals from subgraph - only for current tab
  const { data: actionableProposals, isLoading: isLoadingActionable, error: errorActionable, refetch: refetchActionable } = useProposalsByStatusPaginated(
    activeStatuses,
    activeProposalsPage, 
    ITEMS_PER_PAGE,
    subgraphNetwork,
    shouldFetchActive,
    pageType
  )
  
  const { data: completedProposalsByStatus, isLoading: isLoadingCompletedByStatus, error: errorCompletedByStatus, refetch: refetchCompletedByStatus } = useProposalsByStatusPaginated(
    completedStatuses,
    completedProposalsPage, 
    ITEMS_PER_PAGE,
    subgraphNetwork,
    shouldFetchCompleted,
    pageType
  )
  
  const { data: allProposalsByStatus, isLoading: isLoadingAllByStatus, error: errorAllByStatus, refetch: refetchAllByStatus } = useProposalsByStatusPaginated(
    allStatuses,
    allProposalsPage, 
    ITEMS_PER_PAGE,
    subgraphNetwork,
    shouldFetchAll,
    pageType
  )
  
  // Fetch total counts for pagination - only for current tab
  const { data: actionableCount } = useProposalsCountByStatus(activeStatuses, subgraphNetwork, shouldFetchActive, pageType)
  const { data: completedCount } = useProposalsCountByStatus(completedStatuses, subgraphNetwork, shouldFetchCompleted, pageType)
  const { data: allCount } = useProposalsCountByStatus(allStatuses, subgraphNetwork, shouldFetchAll, pageType)
  
  // Get proposal IDs only for current tab to reduce API calls
  const getCurrentTabProposalIds = () => {
    switch (currentTab) {
      case "active":
        return shouldFetchActive ? (actionableProposals?.proposals?.map(p => p.proposalId) || []) : []
      case "completed":
        return shouldFetchCompleted ? (completedProposalsByStatus?.proposals?.map(p => p.proposalId) || []) : []
      case "all":
        return shouldFetchAll ? (allProposalsByStatus?.proposals?.map(p => p.proposalId) || []) : []
      default:
        return []
    }
  }
  
  const currentTabProposalIds = getCurrentTabProposalIds()
  
  // Fetch vote results only for current tab's proposals
  const { data: voteResultsData, isLoading: isLoadingVoteResults } = useMultipleProposalVoteResults(currentTabProposalIds, subgraphNetwork, pageType)

  // Get current Ethereum mainnet block info from RPC (called only once)
  const getCurrentBlockInfo = useCallback(async () => {
    if (currentBlockInfo || isLoadingBlockInfo) return
    
    setIsLoadingBlockInfo(true)
    try {
      const ethereumRpcUrl = getRPCUrl('ethereum')
      const provider = new ethers.JsonRpcProvider(ethereumRpcUrl)
      const currentBlock = await provider.getBlock('latest')
      
      if (currentBlock) {
        const blockInfo = {
          blockNumber: currentBlock.number,
          timestamp: currentBlock.timestamp
        }
        setCurrentBlockInfo(blockInfo)
      }
    } catch (error) {
      console.error('Error getting Ethereum mainnet block info:', error)
    } finally {
      setIsLoadingBlockInfo(false)
    }
  }, [currentBlockInfo, isLoadingBlockInfo])

  // Process proposals data using useMemo
  const processedProposals = useMemo(() => {
    if (shouldFetchAll && allProposalsByStatus?.proposals && allProposalsByStatus.proposals.length > 0) {
      return allProposalsByStatus.proposals.map((proposal: any) => 
        processStatusBasedProposalData(proposal, currentBlockInfo, governanceConfig, subgraphNetwork, isLoadingGovernanceConfig))
    }
    return []
  }, [shouldFetchAll, allProposalsByStatus?.proposals, currentBlockInfo, governanceConfig, isLoadingGovernanceConfig, subgraphNetwork])

  const processedActiveProposals = useMemo(() => {
    if (shouldFetchActive && actionableProposals?.proposals && actionableProposals.proposals.length > 0) {
      return actionableProposals.proposals
        .map((proposal: any) => processStatusBasedProposalData(proposal, currentBlockInfo, governanceConfig, subgraphNetwork))
        .filter((proposal: any) => {
          const visibleStatuses = ['pending', 'active', 'pending_queue', 'queued', 'executed', 'defeated']
          return visibleStatuses.includes(proposal.status)
        })
    }
    return []
  }, [shouldFetchActive, actionableProposals?.proposals, currentBlockInfo, governanceConfig, subgraphNetwork])

  const processedCompletedProposals = useMemo(() => {
    if (shouldFetchCompleted && completedProposalsByStatus?.proposals && completedProposalsByStatus.proposals.length > 0) {
      return completedProposalsByStatus.proposals
        .map((proposal: any) => processStatusBasedProposalData(proposal, currentBlockInfo, governanceConfig, subgraphNetwork))
        .filter((proposal: any) => proposal.status === 'executed')
    }
    return []
  }, [shouldFetchCompleted, completedProposalsByStatus?.proposals, currentBlockInfo, governanceConfig, subgraphNetwork])

  // Update state when processed data changes
  useEffect(() => {
    setProposals(processedProposals)
  }, [processedProposals])

  useEffect(() => {
    setActiveProposals(processedActiveProposals)
  }, [processedActiveProposals])

  useEffect(() => {
    setCompletedProposals(processedCompletedProposals)
  }, [processedCompletedProposals])

  // Reset page to 1 when tab changes
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
    if (tab === "active") setActiveProposalsPage(1)
    if (tab === "completed") setCompletedProposalsPage(1)
    if (tab === "all") setAllProposalsPage(1)
  }

  // Handle proposal click
  const handleProposalClick = useCallback((proposal: Proposal) => {
    router.push(createProposalUrl(proposal, walletTokenInfo, selectedNetwork, pageType))
  }, [router, walletTokenInfo, selectedNetwork, pageType])

  // Handle delegate wrapper
  const handleDelegateWrapper = useCallback(async () => {
    setIsDelegating(true)
    try {
      await handleDelegate(
        walletAddress,
        walletType ?? undefined,
        selectedNetwork,  // Use selectedNetwork from dropdown instead of subgraphNetwork
        getProvider,
        refetchWalletTokenInfo,
        t,
        pageType,  // Pass the pageType to determine which contract to use
        queryClient  // Pass queryClient to invalidate queries
      )
    } catch (error) {
      // Error is already handled in the utility function
    } finally {
      setIsDelegating(false)
    }
  }, [walletAddress, walletType, selectedNetwork, getProvider, refetchWalletTokenInfo, t, pageType, queryClient])

  // Manual refresh function
  const handleRefresh = async () => {
    setIsInitialLoading(true)
    try {
      queryClient.removeQueries({ queryKey: ['proposalsByStatusPaginated'] })
      queryClient.removeQueries({ queryKey: ['multipleProposalVoteResults'] })
      queryClient.removeQueries({ queryKey: ['proposalsCountByStatus'] })
      
      await queryClient.invalidateQueries({ queryKey: ['proposalsByStatusPaginated'] })
      await queryClient.invalidateQueries({ queryKey: ['multipleProposalVoteResults'] })
      await queryClient.invalidateQueries({ queryKey: ['proposalsCountByStatus'] })
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500))
      
      let refetchPromises: Promise<any>
      if (currentTab === "active") {
        refetchPromises = refetchActionable()
      } else if (currentTab === "completed") {
        refetchPromises = refetchCompletedByStatus()
      } else if (currentTab === "all") {
        refetchPromises = refetchAllByStatus()
      } else {
        refetchPromises = refetchActionable()
      }

      await Promise.all([minLoadingTime, refetchPromises])
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsInitialLoading(false)
    }
  }

  // Get current Ethereum block info on page load
  useEffect(() => {
    getCurrentBlockInfo()
  }, [getCurrentBlockInfo])

  // Initialization effect
  useEffect(() => {
    const currentTimestamp = Date.now()
    setMountTimestamp(currentTimestamp)
    setIsInitialLoading(true)
    
    const initializePageData = async () => {
      try {        
        queryClient.removeQueries({ queryKey: ['proposalsByStatusPaginated', 'PENDING,ACTIVE,QUEUED,EXECUTED'] })
        queryClient.removeQueries({ queryKey: ['proposalsCountByStatus', 'PENDING,ACTIVE,QUEUED,EXECUTED'] })
        
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 100))
        const refetchPromise = refetchActionable()
        await Promise.all([minLoadingTime, refetchPromise])
                
      } catch (error) {
        console.error('Error initializing page data:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    initializePageData()
  }, [queryClient, refetchActionable])

  // Check for recently created proposal on page load
  useEffect(() => {
    const recentProposalData = localStorage.getItem('recentlyCreatedProposal');
    if (recentProposalData) {
      try {
        const proposalInfo = JSON.parse(recentProposalData);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (proposalInfo.timestamp > fiveMinutesAgo) {
          setRecentlyCreatedProposal(proposalInfo);
        } else {
          localStorage.removeItem('recentlyCreatedProposal');
        }
      } catch (error) {
        console.error('Error parsing recently created proposal data:', error);
        localStorage.removeItem('recentlyCreatedProposal');
      }
    }
  }, []);

  // Calculate loading states and pagination
  const isCurrentTabLoading = 
    (currentTab === "active" && isLoadingActionable) ||
    (currentTab === "completed" && isLoadingCompletedByStatus) ||
    (currentTab === "all" && isLoadingAllByStatus)

  const totalActivePages = getTotalPages(actionableCount?.proposals?.length || 0, ITEMS_PER_PAGE)
  const totalCompletedPages = getTotalPages(completedCount?.proposals?.length || 0, ITEMS_PER_PAGE)
  const totalAllPages = getTotalPages(allCount?.proposals?.length || 0, ITEMS_PER_PAGE)

  // Global loading screen
  if (isInitialLoading || isCurrentTabLoading || isLoadingVoteResults || isLoadingBlockNumber || isLoadingGovernanceConfig || isLoadingWalletTokenInfo) {
    return (
      <div className="container mx-auto px-20 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {isInitialLoading ? t('loadingLatestProposals') :
           isLoadingBlockNumber ? t('loadingBlockInfo') : 
           isLoadingGovernanceConfig ? t('loadingGovernanceConfig') :
           isLoadingWalletTokenInfo ? t('loadingWalletTokenInfo') :
           t('loadingProposalsAndResults')}
        </p>
      </div>
    )
  }

  // Error screen
  if ((errorActionable || errorCompletedByStatus || errorAllByStatus || governanceConfigError) && 
      proposals.length === 0 && activeProposals.length === 0 && completedProposals.length === 0) {
    return (
      <div className="container mx-auto px-20 py-16">
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{errorActionable?.message || errorCompletedByStatus?.message || errorAllByStatus?.message || 'Failed to load data'}</p>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={handleRefresh} className="bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700">
            {t('retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-gray-100 whitespace-nowrap">{t('governance')}</h1>
        <div className="flex items-center gap-4">
          {/* Network Selector Dropdown */}
          <div className="relative" ref={networkDropdownRef}>
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="p-3 bg-transparent border border-gray-600 hover:bg-gray-700 rounded-md"
            >
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
            </button>
            {showNetworkDropdown && (
              <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <button
                  onClick={() => {
                    handleNetworkChange('ethereum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </button>
                <button
                  onClick={() => {
                    handleNetworkChange('arbitrum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </button>
              </div>
            )}
          </div>
          
          {/* Desktop Create button - hidden on mobile */}
          <div className="hidden md:flex items-center">
            <Link href={`/vote/create/${pageType}/${selectedNetwork}`}>
              <Button 
                variant="default" 
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg border-orange-500 hover:border-orange-600"
              >
                <Plus className="mr-3 h-5 w-5" />
                {t('createProposal')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Wallet Token Info Card */}
      <WalletTokenInfoComponent
        isConnected={isConnected}
        isLoadingWalletTokenInfo={isLoadingWalletTokenInfo}
        walletTokenInfo={walletTokenInfo}
        walletAddress={walletAddress}
        isDelegating={isDelegating}
        onDelegate={handleDelegateWrapper}
        t={t}
      />

      {/* Error Warning */}
      {(errorActionable || errorCompletedByStatus || errorAllByStatus || governanceConfigError) && (
        <div className="bg-amber-900/20 border border-amber-700/50 text-amber-400 px-4 py-3 rounded-md mb-6">
          <p>{t('warning')}: {(() => {
            const displayError = errorActionable || errorCompletedByStatus || errorAllByStatus || governanceConfigError
            return typeof displayError === 'string' ? displayError : displayError?.message || 'Failed to load data'
          })()}</p>
          <p className="text-sm">
            {governanceConfigError ? 'Using default governance parameters. ' : ''}
            Showing cached or example data.
          </p>
        </div>
      )}

      <Tabs defaultValue="active" value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30">
          <TabsTrigger value="active" className="text-base font-medium data-[state=active]:bg-muted/90 whitespace-nowrap">{t('active')}</TabsTrigger>
          <TabsTrigger value="completed" className="text-base font-medium data-[state=active]:bg-muted/90 whitespace-nowrap">{t('completed')}</TabsTrigger>
          <TabsTrigger value="all" className="text-base font-medium data-[state=active]:bg-muted/90 whitespace-nowrap">{t('allProposals')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {currentTab === "active" ? (
            <>
              <ProposalTable
                proposals={activeProposals}
                onProposalClick={handleProposalClick}
                formatDate={formatDate}
                t={t}
                isLoading={isLoadingActionable}
                emptyMessage={t('noActiveProposalsFound')}
              />
              <PaginationComponent 
                currentPage={activeProposalsPage}
                totalPages={totalActivePages}
                onPageChange={setActiveProposalsPage}
              />
              {(actionableCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      {t('showing')} {((activeProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(activeProposalsPage * ITEMS_PER_PAGE, actionableCount?.proposals?.length || 0)} {t('of')} {actionableCount?.proposals?.length || 0} {t('proposals')}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              {t('clickActiveTabToView')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {currentTab === "completed" ? (
            <>
              <ProposalTable
                proposals={completedProposals}
                onProposalClick={handleProposalClick}
                formatDate={formatDate}
                t={t}
                isLoading={isLoadingCompletedByStatus}
                emptyMessage={t('noCompletedProposalsFound')}
              />
              <PaginationComponent 
                currentPage={completedProposalsPage}
                totalPages={totalCompletedPages}
                onPageChange={setCompletedProposalsPage}
              />
              {(completedCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      {t('showing')} {((completedProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(completedProposalsPage * ITEMS_PER_PAGE, completedCount?.proposals?.length || 0)} {t('of')} {completedCount?.proposals?.length || 0} {t('proposals')}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              {t('clickCompletedTabToView')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {currentTab === "all" ? (
            <>
              <ProposalTable
                proposals={proposals}
                onProposalClick={handleProposalClick}
                formatDate={formatDate}
                t={t}
                isLoading={isLoadingAllByStatus}
                emptyMessage={t('noProposalsFound')}
              />
              <PaginationComponent 
                currentPage={allProposalsPage}
                totalPages={totalAllPages}
                onPageChange={setAllProposalsPage}
              />
              {(allCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      {t('showing')} {((allProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(allProposalsPage * ITEMS_PER_PAGE, allCount?.proposals?.length || 0)} {t('of')} {allCount?.proposals?.length || 0} {t('proposals')}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              {t('clickAllTabToView')}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Float Buttons - Only visible on mobile */}
      {!isMobileMenuOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="p-4">
            <Link href={`/vote/create/${pageType}/${selectedNetwork}`}>
              <Button 
                variant="default" 
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base border-orange-500 hover:border-orange-600"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t('createProposal')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 