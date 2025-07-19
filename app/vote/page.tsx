'use client'

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Clock, Plus, Vote as VoteIcon, Loader2 } from "lucide-react"
import { useMultipleProposalVoteResults, useProposalsByStatusPaginated, useProposalsCountByStatus } from "@/app/subgraph/Proposals"
import { useQueryClient } from '@tanstack/react-query'
import { STELE_DECIMALS, getSteleTokenAddress, getRPCUrl } from "@/lib/constants"
import { ethers } from "ethers"
import { useGovernanceConfig } from "@/app/hooks/useGovernanceConfig"
import { useBlockNumber } from "@/app/hooks/useBlockNumber"
import { useWalletTokenInfo } from "@/app/hooks/useWalletTokenInfo"
import { useWallet } from "@/app/hooks/useWallet"
import ERC20VotesABI from "@/app/abis/ERC20Votes.json"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useLanguage } from "@/lib/language-context"
import { useMobileMenu } from "@/lib/mobile-menu-context"

// Interface for proposal data
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  fullProposer?: string;
  status: 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated';
  votesFor: number;
  votesAgainst: number;
  abstain: number;
  startTime: Date;
  endTime: Date;
  proposalId: string;
  blockTimestamp: string;
  blockNumber: string;
  values: string[];
  transactionHash: string;
}

export default function VotePage() {
  const { t } = useLanguage()
  const { isMobileMenuOpen } = useMobileMenu()
  const router = useRouter()
  // Use global wallet hook instead of local state
  const { address: walletAddress, isConnected, walletType, network, getProvider } = useWallet()
  const queryClient = useQueryClient()
  const [isDelegating, setIsDelegating] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([])
  const [completedProposals, setCompletedProposals] = useState<Proposal[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [mountTimestamp, setMountTimestamp] = useState(Date.now())
  
  // Fetch governance configuration from smart contract
  const { config: governanceConfig, isLoading: isLoadingGovernanceConfig, error: governanceConfigError } = useGovernanceConfig()
  
  // Get current block number with global caching
  const { data: blockInfo, isLoading: isLoadingBlockNumber } = useBlockNumber()

  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'

  // Get wallet token info with global caching (use network-specific token)
  const { data: walletTokenInfo, isLoading: isLoadingWalletTokenInfo, refetch: refetchWalletTokenInfo } = useWalletTokenInfo(walletAddress, subgraphNetwork)

  // State for current block info (for timestamp calculation)
  const [currentBlockInfo, setCurrentBlockInfo] = useState<{blockNumber: number, timestamp: number} | null>(null)
  const [isLoadingBlockInfo, setIsLoadingBlockInfo] = useState(false)
  
  // State for tracking recently created proposal
  const [recentlyCreatedProposal, setRecentlyCreatedProposal] = useState<any>(null)
  const [hasCheckedForNewProposal, setHasCheckedForNewProposal] = useState(false)
  
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
    shouldFetchActive // Only enable when current tab is active
  )
  
  const { data: completedProposalsByStatus, isLoading: isLoadingCompletedByStatus, error: errorCompletedByStatus, refetch: refetchCompletedByStatus } = useProposalsByStatusPaginated(
    completedStatuses,
    completedProposalsPage, 
    ITEMS_PER_PAGE,
    subgraphNetwork,
    shouldFetchCompleted // Only enable when current tab is completed
  )
  
  const { data: allProposalsByStatus, isLoading: isLoadingAllByStatus, error: errorAllByStatus, refetch: refetchAllByStatus } = useProposalsByStatusPaginated(
    allStatuses,
    allProposalsPage, 
    ITEMS_PER_PAGE,
    subgraphNetwork,
    shouldFetchAll // Only enable when current tab is all
  )
  
  // Fetch total counts for pagination - only for current tab
  const { data: actionableCount } = useProposalsCountByStatus(activeStatuses, subgraphNetwork, shouldFetchActive)
  const { data: completedCount } = useProposalsCountByStatus(completedStatuses, subgraphNetwork, shouldFetchCompleted)
  const { data: allCount } = useProposalsCountByStatus(allStatuses, subgraphNetwork, shouldFetchAll)
  
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
  const { data: voteResultsData, isLoading: isLoadingVoteResults } = useMultipleProposalVoteResults(currentTabProposalIds, subgraphNetwork)

  // Reset page to 1 when tab changes and enable data fetching for new tab
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
    if (tab === "active") setActiveProposalsPage(1)
    if (tab === "completed") setCompletedProposalsPage(1)
    if (tab === "all") setAllProposalsPage(1)
  }

  // Get current Ethereum mainnet block info from RPC (called only once)
  // Note: Governor contracts use Ethereum block numbers even on L2s for cross-chain governance
  const getCurrentBlockInfo = async () => {
    if (currentBlockInfo || isLoadingBlockInfo) return // Prevent multiple calls
    
    setIsLoadingBlockInfo(true)
    try {
      // Always use Ethereum mainnet for block info since voteStart/voteEnd use Ethereum block numbers
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
  }

  // Calculate timestamp for any block number based on Ethereum mainnet block info
  // Note: voteStart/voteEnd values are Ethereum block numbers even on L2 networks
  const calculateBlockTimestamp = (targetBlockNumber: string): number => {
    if (!currentBlockInfo) {
      console.warn('No current Ethereum block info available for timestamp calculation')
      return Date.now() / 1000 // Return current time as fallback
    }
    
    const targetBlock = parseInt(targetBlockNumber)
    const blockDifference = targetBlock - currentBlockInfo.blockNumber
    
    // Always use Ethereum mainnet block time (12 seconds) since Governor uses Ethereum blocks
    const ETHEREUM_BLOCK_TIME_SECONDS = 12
    const estimatedTimestamp = currentBlockInfo.timestamp + (blockDifference * ETHEREUM_BLOCK_TIME_SECONDS)
    return estimatedTimestamp
  }

  // Get current block info on page load (only once)
  useEffect(() => {
    getCurrentBlockInfo()
  }, [])

  // Simplified initialization - only clear cache for current tab
  useEffect(() => {
    const currentTimestamp = Date.now()
    setMountTimestamp(currentTimestamp)
    setIsInitialLoading(true)
    
    const initializePageData = async () => {
      try {        
        // Only clear cache for the active tab initially
        queryClient.removeQueries({ queryKey: ['proposalsByStatusPaginated', 'PENDING,ACTIVE,QUEUED,EXECUTED'] })
        queryClient.removeQueries({ queryKey: ['proposalsCountByStatus', 'PENDING,ACTIVE,QUEUED,EXECUTED'] })
        
        // Show loading for minimum 500ms
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500))
        
        // Small delay to ensure cache is cleared
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Only refetch active proposals initially
        const refetchPromise = refetchActionable()
        
        // Wait for both minimum loading time and data fetching
        await Promise.all([minLoadingTime, refetchPromise])
                
      } catch (error) {
        console.error('Error initializing page data:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    // Initialize page data on every mount
    initializePageData()
  }, []) // Empty dependency array to run on every mount

  // Check for recently created proposal on page load
  useEffect(() => {
    const recentProposalData = localStorage.getItem('recentlyCreatedProposal');
    if (recentProposalData) {
      try {
        const proposalInfo = JSON.parse(recentProposalData);
        // Check if the proposal was created within the last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (proposalInfo.timestamp > fiveMinutesAgo) {
          setRecentlyCreatedProposal(proposalInfo);
        } else {
          // Remove old proposal data
          localStorage.removeItem('recentlyCreatedProposal');
        }
      } catch (error) {
        console.error('Error parsing recently created proposal data:', error);
        localStorage.removeItem('recentlyCreatedProposal');
      }
    }
  }, []);

  // Check if the recently created proposal appears in the proposal list
  useEffect(() => {
    if (!recentlyCreatedProposal || hasCheckedForNewProposal) return;

    const checkForNewProposal = () => {
      // Check in all proposal data sources
      const allProposalSources = [
        actionableProposals?.proposals || [],
        completedProposalsByStatus?.proposals || [],
        allProposalsByStatus?.proposals || []
      ];

      let found = false;
      for (const proposalSource of allProposalSources) {
        const foundProposal = proposalSource.find((proposal: any) => {
          // Check by transaction hash or by title match
          return proposal.transactionHash === recentlyCreatedProposal.transactionHash ||
                 (proposal.description && proposal.description.includes(recentlyCreatedProposal.title));
        });
        
        if (foundProposal) {
          found = true;
          break;
        }
      }

      if (found) {
        // Proposal found in the list, clean up and update state
        localStorage.removeItem('recentlyCreatedProposal');
        setHasCheckedForNewProposal(true);
        setRecentlyCreatedProposal(null);
        // Instead of reload, just refetch data to update UI
        refetchActionable();
        refetchAllByStatus();
        refetchCompletedByStatus();
      }
    };

    // Start checking after proposal data is loaded
    if (actionableProposals || completedProposalsByStatus || allProposalsByStatus) {
      checkForNewProposal();
      
      // If not found immediately, check every 30 seconds for up to 5 minutes
      let attempts = 0;
      const maxAttempts = 10; // 5 minutes with 30-second intervals
      
      const checkInterval = setInterval(() => {
        attempts++;
        checkForNewProposal();
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // Clean up after max attempts
          localStorage.removeItem('recentlyCreatedProposal');
          setRecentlyCreatedProposal(null);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkInterval);
    }
  }, [recentlyCreatedProposal, hasCheckedForNewProposal, actionableProposals, completedProposalsByStatus, allProposalsByStatus]);

  // Enhanced refetch when recently created proposal exists
  useEffect(() => {
    if (!recentlyCreatedProposal) return;

    const interval = setInterval(() => {
      // Refetch all proposal data
      refetchActionable();
      refetchAllByStatus();
      refetchCompletedByStatus();
    }, 15000); // Refetch every 15 seconds

    return () => clearInterval(interval);
  }, [recentlyCreatedProposal, refetchActionable, refetchAllByStatus, refetchCompletedByStatus]);

  // Parse proposal details from description
  const parseProposalDetails = (description: string) => {
    // Usually descriptions are in format "Title: Description"
    const parts = description.split(':')
    let title = ''
    let desc = description

    if (parts.length > 1) {
      title = parts[0].trim()
      desc = parts.slice(1).join(':').trim()
    }

    return { title, description: desc }
  }

  // Simple status determination - since active proposals are filtered by subgraph,
  // we just need basic logic for all proposals view
  const getProposalStatus = (voteStart: string, voteEnd: string): 'active' | 'completed' | 'rejected' => {
    // For simplicity, we'll use timestamp-based logic here
    // The accurate filtering is done in the subgraph for active proposals
    const now = Date.now() / 1000
    const startTime = Number(voteStart)
    const endTime = Number(voteEnd)
    
    if (now < startTime) {
      return 'active' // Pending/upcoming
    } else if (now >= startTime && now <= endTime) {
      return 'active' // Currently active
    } else {
      return 'completed' // Ended
    }
  }

  // Helper function to process proposal data
  const processProposalData = (proposalData: any, forceStatus?: 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated') => {
    const details = parseProposalDetails(proposalData.description)
    
    // Find vote result for this proposal first
    const voteResult = voteResultsData?.proposalVoteResults?.find(
      result => result.id === proposalData.proposalId
    )
    
    // Convert vote counts from wei to STELE tokens
    const votesFor = voteResult ? parseFloat(ethers.formatUnits(voteResult.forVotes, STELE_DECIMALS)) : 0
    const votesAgainst = voteResult ? parseFloat(ethers.formatUnits(voteResult.againstVotes, STELE_DECIMALS)) : 0
    const abstain = voteResult ? parseFloat(ethers.formatUnits(voteResult.abstainVotes, STELE_DECIMALS)) : 0
    
    // Calculate timestamps based on current block info
    let startTimestamp: number
    let endTimestamp: number
    
    // Try to use actual timestamp data if available, otherwise calculate from blocks
    if (proposalData.startTimestamp && proposalData.endTimestamp) {
      startTimestamp = parseInt(proposalData.startTimestamp)
      endTimestamp = parseInt(proposalData.endTimestamp)
    } else if (proposalData.voteStart && proposalData.voteEnd) {
      startTimestamp = calculateBlockTimestamp(proposalData.voteStart)
      endTimestamp = calculateBlockTimestamp(proposalData.voteEnd)
    } else {
      // Fallback to current time
      const now = Date.now() / 1000
      startTimestamp = now - 86400 // 1 day ago
      endTimestamp = now + 86400 // 1 day from now
    }
    
    // Determine status based on time and vote results
    let status: 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated'
    if (forceStatus) {
      status = forceStatus
    } else {
      const now = Date.now() / 1000 // Current time in seconds
      
      if (now < startTimestamp) {
        // Voting hasn't started yet
        status = 'pending'
      } else if (now >= startTimestamp && now <= endTimestamp) {
        // Currently in voting period
        status = 'active'        
      } else {
        // Voting period has ended - check vote results
        const totalDecisiveVotes = votesFor + votesAgainst
        
        if (totalDecisiveVotes === 0) {
          // No votes cast - consider defeated
          status = 'defeated'
        } else if (votesFor > votesAgainst) {
          // More votes for than against - passed
          status = 'pending_queue'
        } else {
          // More votes against or tied - defeated
          status = 'defeated'
        }
      }
    }

    return {
      id: proposalData.proposalId,
      proposalId: proposalData.proposalId,
      title: details.title || `Proposal #${proposalData.proposalId}`,
      description: details.description,
      proposer: `${proposalData.proposer.slice(0, 6)}...${proposalData.proposer.slice(-4)}`,
      fullProposer: proposalData.proposer, // Store full proposer address
      status,
      votesFor,
      votesAgainst,
      abstain,
      startTime: new Date(startTimestamp * 1000),
      endTime: new Date(endTimestamp * 1000),
      blockTimestamp: proposalData.blockTimestamp,
      blockNumber: proposalData.blockNumber,
      values: proposalData.values,
      transactionHash: proposalData.transactionHash
    }
  }

  // Helper function to process status-based proposal data (new format with voteResult)
  const processStatusBasedProposalData = (proposalData: any) => {
    const details = parseProposalDetails(proposalData.description)
    
    // Convert vote counts from wei to STELE tokens
    const votesFor = proposalData.voteResult ? parseFloat(ethers.formatUnits(proposalData.voteResult.forVotes, STELE_DECIMALS)) : 0
    const votesAgainst = proposalData.voteResult ? parseFloat(ethers.formatUnits(proposalData.voteResult.againstVotes, STELE_DECIMALS)) : 0
    const abstain = proposalData.voteResult?.abstainVotes ? parseFloat(ethers.formatUnits(proposalData.voteResult.abstainVotes, STELE_DECIMALS)) : 0
    
    // Parse timestamps from the createdAt field
    const createdAt = new Date(parseInt(proposalData.createdAt) * 1000)
    const queuedAt = proposalData.queuedAt ? new Date(parseInt(proposalData.queuedAt) * 1000) : null
    const executedAt = proposalData.executedAt ? new Date(parseInt(proposalData.executedAt) * 1000) : null
    const canceledAt = proposalData.canceledAt ? new Date(parseInt(proposalData.canceledAt) * 1000) : null
    
    // Calculate voting period - prioritize actual voteStart/voteEnd blocks if available
    let startTime: Date
    let endTime: Date
    
    if (proposalData.voteStart && proposalData.voteEnd && currentBlockInfo) {
      // Use actual voting period from blockchain data
      const startTimestamp = calculateBlockTimestamp(proposalData.voteStart)
      const endTimestamp = calculateBlockTimestamp(proposalData.voteEnd)
      startTime = new Date(startTimestamp * 1000)
      endTime = new Date(endTimestamp * 1000)
    } else {
      // Fallback to estimated periods based on status and timestamps
      // Use actual governance config if available, otherwise use default estimates
      const votingPeriodBlocks = governanceConfig?.votingPeriod || 21600 // Default: ~3 days at 12 sec/block
      const votingDelayBlocks = governanceConfig?.votingDelay || 7200 // Default: ~1 day at 12 sec/block
      
      // Convert blocks to milliseconds using Ethereum block time since Governor uses Ethereum blocks
      const ETHEREUM_BLOCK_TIME_MS = 12 * 1000 // 12 seconds per block
      const votingPeriodMs = votingPeriodBlocks * ETHEREUM_BLOCK_TIME_MS
      const votingDelayMs = votingDelayBlocks * ETHEREUM_BLOCK_TIME_MS
      
      if (proposalData.status === 'PENDING') {
        // For pending proposals, voting hasn't started yet
        startTime = new Date(createdAt.getTime() + votingDelayMs)
        endTime = new Date(startTime.getTime() + votingPeriodMs)
      } else if (proposalData.status === 'ACTIVE') {
        // For active proposals, voting is ongoing
        startTime = new Date(createdAt.getTime() + votingDelayMs)
        endTime = new Date(startTime.getTime() + votingPeriodMs)
      } else if (proposalData.status === 'QUEUED' && queuedAt) {
        // For queued proposals, voting has ended
        startTime = new Date(createdAt.getTime() + votingDelayMs)
        endTime = new Date(queuedAt.getTime() - 24 * 60 * 60 * 1000) // Assume queued 1 day after voting ended
      } else if (proposalData.status === 'EXECUTED' && executedAt) {
        // For executed proposals, use execution time to work backwards
        const totalProcessTime = votingDelayMs + votingPeriodMs + (3 * 24 * 60 * 60 * 1000) // voting delay + voting period + 3 days processing
        startTime = new Date(executedAt.getTime() - totalProcessTime)
        endTime = new Date(executedAt.getTime() - (3 * 24 * 60 * 60 * 1000)) // 3 days from vote end to execution
      } else if (proposalData.status === 'CANCELED' && canceledAt) {
        // For canceled proposals
        startTime = new Date(createdAt.getTime() + votingDelayMs)
        endTime = new Date(canceledAt.getTime())
      } else {
        // Default fallback
        startTime = new Date(createdAt.getTime() + votingDelayMs)
        endTime = new Date(startTime.getTime() + votingPeriodMs)
      }
      
      const configSource = governanceConfig ? 'smart contract' : 'default estimates'
    }
    
    // Validate and correct status based on current time and vote results
    const validateStatus = (subgraphStatus: string): 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated' => {
      // For final states (EXECUTED, CANCELED), trust the subgraph
      if (subgraphStatus === 'EXECUTED') return 'executed'
      if (subgraphStatus === 'CANCELED') return 'canceled'
      if (subgraphStatus === 'QUEUED') return 'queued'
      
      // For other states, validate with time-based logic
      const now = Date.now() / 1000 // Current time in seconds
      const startTimestamp = startTime.getTime() / 1000
      const endTimestamp = endTime.getTime() / 1000
      
      if (now < startTimestamp) {
        // Voting hasn't started yet
        return 'pending'
      } else if (now >= startTimestamp && now <= endTimestamp) {
        // Currently in voting period        
        return 'active'
      } else {
        // Voting period has ended - check vote results
        const totalDecisiveVotes = votesFor + votesAgainst
        
        if (totalDecisiveVotes === 0) {
          // No votes cast - consider defeated
          return 'defeated'
        } else if (votesFor > votesAgainst) {
          // More votes for than against - should be pending queue or higher
          if (subgraphStatus === 'DEFEATED') {
            return 'pending_queue'
          }
          // If subgraph shows PENDING_QUEUE or higher, trust it
          const mappedStatus = mapStatus(subgraphStatus)
          return mappedStatus
        } else {
          // More votes against or tied - defeated
          return 'defeated'
        }
      }
    }
    
    // Map status from subgraph to our internal status
    const mapStatus = (status: string): 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated' => {
      switch (status) {
        case 'PENDING': return 'pending'
        case 'ACTIVE': return 'active'
        case 'PENDING_QUEUE': return 'pending_queue'
        case 'QUEUED': return 'queued'
        case 'EXECUTED': return 'executed'
        case 'CANCELED': return 'canceled'
        case 'DEFEATED': return 'defeated'
        default: return 'pending'
      }
    }

    const validatedStatus = validateStatus(proposalData.status)

    return {
      id: proposalData.proposalId,
      proposalId: proposalData.proposalId,
      title: details.title || `Proposal #${proposalData.proposalId}`,
      description: details.description,
      proposer: `${proposalData.proposer.slice(0, 6)}...${proposalData.proposer.slice(-4)}`,
      fullProposer: proposalData.proposer, // Store full proposer address
      status: validatedStatus,
      votesFor,
      votesAgainst,
      abstain,
      startTime,
      endTime,
      blockTimestamp: proposalData.createdAt,
      blockNumber: proposalData.blockNumber || proposalData.voteStart || proposalData.createdAt || '',
      values: proposalData.values || [],
      transactionHash: proposalData.transactionHash || `proposal-${proposalData.proposalId}`
    }
  }

  // Process all proposals data using useMemo (use paginated data)
  const processedProposals = useMemo(() => {
    // Only process if we should fetch all data and have data
    if (shouldFetchAll && allProposalsByStatus?.proposals && allProposalsByStatus.proposals.length > 0) {
      return allProposalsByStatus.proposals.map((proposal: any) => processStatusBasedProposalData(proposal))
    }
    return []
  }, [shouldFetchAll, allProposalsByStatus?.proposals, voteResultsData?.proposalVoteResults])

  // Process active proposals data using useMemo (use paginated data)
  const processedActiveProposals = useMemo(() => {
    // Only process if we should fetch active data and have data
    if (shouldFetchActive && actionableProposals?.proposals && actionableProposals.proposals.length > 0) {
      return actionableProposals.proposals
        .map((proposal: any) => processStatusBasedProposalData(proposal))
        .filter((proposal: any) => {
          // Show actionable proposals and defeated proposals (so users can see vote results)
          // Only exclude canceled proposals
          const visibleStatuses = ['pending', 'active', 'pending_queue', 'queued', 'executed', 'defeated']
          return visibleStatuses.includes(proposal.status)
        })
    }
    return []
  }, [shouldFetchActive, actionableProposals?.proposals, voteResultsData?.proposalVoteResults])

  // Process completed proposals data using useMemo (use paginated data)
  const processedCompletedProposals = useMemo(() => {
    // Only process if we should fetch completed data and have data
    if (shouldFetchCompleted && completedProposalsByStatus?.proposals && completedProposalsByStatus.proposals.length > 0) {
      return completedProposalsByStatus.proposals
        .map((proposal: any) => processStatusBasedProposalData(proposal))
        .filter((proposal: any) => proposal.status === 'executed') // Only show executed proposals
    }
    return []
  }, [shouldFetchCompleted, completedProposalsByStatus?.proposals, voteResultsData?.proposalVoteResults])

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

  // Helper function to determine if voting is currently active
  const isVotingActive = (proposal: Proposal): boolean => {
    const now = Date.now()
    const startTime = proposal.startTime.getTime()
    const endTime = proposal.endTime.getTime()
    
    // Voting is active if current time is between start and end time
    return now >= startTime && now <= endTime
  }

  // Status badge component with real-time status calculation
  const StatusBadge = ({ proposal }: { proposal: Proposal }) => {
    // Calculate real-time status based on current time and vote results
    const now = Date.now()
    const startTime = proposal.startTime.getTime()
    const endTime = proposal.endTime.getTime()
    const votesFor = proposal.votesFor
    const votesAgainst = proposal.votesAgainst
    
    let realTimeStatus: string
    let statusColor: string
    let statusIcon: string
    let statusText: string
    
    // For final states (EXECUTED, CANCELED, QUEUED), trust the stored status
    if (proposal.status === 'executed') {
      realTimeStatus = 'EXECUTED'
      statusColor = 'bg-green-100 text-green-800'
      statusIcon = '✨'
      statusText = t('executed')
    } else if (proposal.status === 'canceled') {
      realTimeStatus = 'CANCELED'
      statusColor = 'bg-gray-100 text-gray-800'
      statusIcon = '🚫'
      statusText = t('canceled')
    } else if (proposal.status === 'queued') {
      realTimeStatus = 'QUEUED'
      statusColor = 'bg-blue-100 text-blue-800'
      statusIcon = '🔄'
      statusText = t('queued')
    } else {
      // Calculate status based on time and vote results
      if (now < startTime) {
        // Voting hasn't started yet
        realTimeStatus = 'PENDING'
        statusColor = 'bg-yellow-100 text-yellow-800'
        statusIcon = '⏳'
        statusText = t('pending')
      } else if (now >= startTime && now <= endTime) {
        // Currently in voting period
        realTimeStatus = 'ACTIVE'
        statusColor = 'bg-green-100 text-green-800'
        statusIcon = '🗳️'
        statusText = t('voting')
      } else {
        // Voting period has ended - check vote results
        const totalDecisiveVotes = votesFor + votesAgainst
        
        if (totalDecisiveVotes === 0) {
          // No votes cast - consider defeated
          realTimeStatus = 'DEFEATED'
          statusColor = 'bg-red-100 text-red-800'
          statusIcon = '❌'
          statusText = t('defeated')
        } else if (votesFor > votesAgainst) {
          // More votes for than against - passed, pending queue
          realTimeStatus = 'PENDING_QUEUE'
          statusColor = 'bg-orange-100 text-orange-800'
          statusIcon = '⏳'
          statusText = 'Pending Queue'
        } else {
          // More votes against or tied - defeated
          realTimeStatus = 'DEFEATED'
          statusColor = 'bg-red-100 text-red-800'
          statusIcon = '❌'
          statusText = t('defeated')
        }
      }
    }
    
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}>
        {statusIcon} {statusText}
      </div>
    )
  }

  // Progress bar component
  const ProgressBar = ({ votesFor, votesAgainst, abstain }: { votesFor: number, votesAgainst: number, abstain: number }) => {
    const total = votesFor + votesAgainst + abstain
    
    // Avoid division by zero
    if (total === 0) {
      return (
        <div className="w-48 mt-2">
          <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden"></div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">0%</span>
            <span className="text-red-600">0%</span>
            <span className="text-gray-500">0%</span>
          </div>
        </div>
      )
    }
    
    const forPercentage = (votesFor / total) * 100
    const againstPercentage = (votesAgainst / total) * 100
    const abstainPercentage = (abstain / total) * 100

    return (
      <div className="w-48 mt-2">
        <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="bg-green-500" style={{ width: `${forPercentage}%` }}></div>
          <div className="bg-red-500" style={{ width: `${againstPercentage}%` }}></div>
          <div className="bg-gray-400" style={{ width: `${abstainPercentage}%` }}></div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-600">{Math.round(forPercentage)}%</span>
          <span className="text-red-600">{Math.round(againstPercentage)}%</span>
          <span className="text-gray-500">{Math.round(abstainPercentage)}%</span>
        </div>
      </div>
    )
  }
  
  // Format date in a readable way with time
  const formatDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    // Check if date is too far in future (likely calculation error)
    const now = new Date()
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    
    if (date > oneYearFromNow) {
      return 'TBD (Calculation Error)'
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Create URL with proposal data as query parameters
  const createProposalUrl = (proposal: Proposal) => {
    const params = new URLSearchParams({
      title: proposal.title,
      description: proposal.description,
      proposer: proposal.fullProposer || proposal.proposer, // Use full proposer address if available
      status: proposal.status,
      startTime: proposal.startTime.toISOString(),
      endTime: proposal.endTime.toISOString(),
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
      abstain: proposal.abstain.toString(),
      blockTimestamp: proposal.blockTimestamp,
      blockNumber: proposal.blockNumber,
      values: JSON.stringify(proposal.values),
      transactionHash: proposal.transactionHash || '',
      // Add cached token info to avoid RPC requests in detail page
      tokenBalance: walletTokenInfo?.formattedBalance || '0',
      delegatedTo: walletTokenInfo?.delegatedTo || ''
    })
    
    return `/vote/${proposal.id}?${params.toString()}`
  }

  // Delegate tokens to self
  const handleDelegate = async () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: t('walletNotConnected'),
        description: t('connectWallet'),
      })
      return
    }

    setIsDelegating(true)

    try {
      // WalletConnect only - use getProvider from useWallet hook
      const provider = getProvider();
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.");
      }

      // Try to get signer first, only request accounts if needed
      let signer;
      try {
        signer = await provider.getSigner();
        await signer.getAddress(); // Verify we can get address
      } catch (error: any) {
        console.warn('Could not get signer, requesting accounts:', error);
        
        // Check if user rejected the request
        if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
          throw new Error("Connection request was rejected by user");
        }
        
        // Request wallet connection as fallback
        await provider.send('eth_requestAccounts', [])
        signer = await provider.getSigner();
      }
      const steleTokenAddress = getSteleTokenAddress(subgraphNetwork)
      const votesContract = new ethers.Contract(steleTokenAddress, ERC20VotesABI.abi, signer)

      // Delegate to self
      const tx = await votesContract.delegate(walletAddress)

      toast({
        title: t('transactionSubmitted'),
        description: t('delegationProcessing'),
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      toast({
        title: t('delegationSuccessful'),
        description: t('delegationSuccessfulMessage'),
        action: (
                      <ToastAction 
              altText={t('viewOnEtherscan')}
              onClick={() => window.open(`https://etherscan.io/tx/${receipt.hash}`, '_blank')}
            >
              {t('viewOnEtherscan')}
            </ToastAction>
        ),
      })

      // Refresh wallet token info after delegation
      setTimeout(() => {
        // This will trigger a re-fetch of wallet token info
        refetchWalletTokenInfo()
      }, 3000)

    } catch (error: any) {
      console.error("Delegation error:", error)
      
      let errorMessage = t('errorDelegatingTokens')
      let toastVariant: "destructive" | "default" = "destructive"
      let toastTitle = t('delegationFailed')
      
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied') || error.message?.includes('Connection request was rejected')) {
        errorMessage = t('transactionRejected')
        toastVariant = "default"
        toastTitle = "Request Cancelled"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = t('insufficientFundsGas')
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = t('phantomWalletNotInstalled')
      }

      toast({
        variant: toastVariant,
        title: toastTitle,
        description: errorMessage,
      })
    } finally {
      setIsDelegating(false)
    }
  }

  // Manual refresh function for the refresh button
  const handleRefresh = async () => {
    setIsInitialLoading(true)
    try {
      // Clear all proposal-related cache to force fresh data
      queryClient.removeQueries({ queryKey: ['proposalsByStatusPaginated'] })
      queryClient.removeQueries({ queryKey: ['multipleProposalVoteResults'] })
      queryClient.removeQueries({ queryKey: ['proposalsCountByStatus'] })
      
      // Also invalidate for good measure
      await queryClient.invalidateQueries({ queryKey: ['proposalsByStatusPaginated'] })
      await queryClient.invalidateQueries({ queryKey: ['multipleProposalVoteResults'] })
      await queryClient.invalidateQueries({ queryKey: ['proposalsCountByStatus'] })
      
      // Show loading for minimum 0.5 seconds
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500))
      
      // Only refetch current tab data to avoid GraphQL errors with empty arrays
      let refetchPromises: Promise<any>
      if (currentTab === "active") {
        refetchPromises = refetchActionable()
      } else if (currentTab === "completed") {
        refetchPromises = refetchCompletedByStatus()
      } else if (currentTab === "all") {
        refetchPromises = refetchAllByStatus()
      } else {
        // Default to active tab
        refetchPromises = refetchActionable()
      }
      
      // Wait for both minimum loading time and data fetching
      await Promise.all([minLoadingTime, refetchPromises])
      
              toast({
          title: t('success'),
          description: t('dataRefreshedSuccessfully'),
          variant: "default",
        })
    } catch (error) {
      console.error('Error refreshing data:', error)
              toast({
          title: "Error",
          description: t('failedToRefreshData'),
          variant: "destructive",
        })
    } finally {
      setIsInitialLoading(false)
    }
  }

  // Pagination helper functions
  const getPaginatedData = (data: Proposal[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / ITEMS_PER_PAGE)
  }

  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  // Use paginated data directly from server (no client-side pagination needed)
  const paginatedActiveProposals = activeProposals
  const paginatedCompletedProposals = completedProposals
  const paginatedAllProposals = proposals

  // Total pages based on server count data
  const totalActivePages = getTotalPages(actionableCount?.proposals?.length || 0)
  const totalCompletedPages = getTotalPages(completedCount?.proposals?.length || 0)
  const totalAllPages = getTotalPages(allCount?.proposals?.length || 0)

  // Pagination component
  const PaginationComponent = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void 
  }) => {
    if (totalPages <= 1) return null

    const pageNumbers = generatePageNumbers(currentPage, totalPages)

    return (
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-800"}
              />
            </PaginationItem>
            
            {pageNumbers.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer hover:bg-gray-800"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-800"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  // Only show global loading for initial load and essential data
  const isCurrentTabLoading = 
    (currentTab === "active" && isLoadingActionable) ||
    (currentTab === "completed" && isLoadingCompletedByStatus) ||
    (currentTab === "all" && isLoadingAllByStatus)

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

  if ((errorActionable || errorCompletedByStatus || errorAllByStatus || governanceConfigError) && proposals.length === 0 && activeProposals.length === 0 && completedProposals.length === 0) {
    return (
      <div className="container mx-auto px-20 py-16">
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{errorActionable?.message || errorCompletedByStatus?.message || errorAllByStatus?.message || 'Failed to load data'}</p>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            // Only refetch current tab data to avoid GraphQL errors with empty arrays
            if (currentTab === "active") {
              refetchActionable()
            } else if (currentTab === "completed") {
              refetchCompletedByStatus()
            } else if (currentTab === "all") {
              refetchAllByStatus()
            } else {
              // Default to active tab
              refetchActionable()
            }
          }} className="bg-gray-800 text-gray-100 border-gray-600 hover:bg-gray-700">{t('retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-gray-100 whitespace-nowrap">{t('governance')}</h1>
        <div className="flex items-center gap-4">
          {/* Desktop buttons - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="default" 
              size="lg"
              onClick={handleRefresh}
              disabled={isInitialLoading || isCurrentTabLoading} 
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg border-orange-500 hover:border-orange-600 disabled:border-orange-500/50"
            >
              {isInitialLoading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <Clock className="mr-3 h-5 w-5" />
                  {t('refresh')}
                </>
              )}
            </Button>
            <Link href="/vote/create">
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
      {isConnected && (
        <Card className="mb-6 bg-muted/80 border-0">
          {/* Delegate Button - Show prominently when user has tokens but is not delegated */}
          {!isLoadingWalletTokenInfo && walletTokenInfo && 
           Number(walletTokenInfo.formattedBalance) > 0 && 
           walletTokenInfo.delegatedTo === "0x0000000000000000000000000000000000000000" && (
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-orange-400">{t('delegateRequiredToVote')}</h3>
                  <p className="text-xs text-gray-400 hidden md:block">{t('youNeedToDelegate')}</p>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleDelegate}
                  disabled={isDelegating}
                  className="border-orange-600 text-orange-400 hover:bg-orange-900/20 bg-gray-800"
                >
                  {isDelegating ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t('delegating')}
                    </div>
                  ) : (
                    <>
                      <VoteIcon className="mr-2 h-3 w-3" />
                      {t('delegateToSelf')}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          )}
          
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {isLoadingWalletTokenInfo ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-base text-gray-400">{t('loadingTokenInfo')}</span>
                </div>
              ) : walletTokenInfo ? (
                <>
                  <div className="text-base">
                    <span className="font-medium text-gray-300">{t('balance')}: </span>
                    <span className="font-mono text-gray-100">{Number(walletTokenInfo.formattedBalance).toLocaleString()} STELE</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      <span>{t('delegatedTo')}: </span>
                      {walletTokenInfo.delegatedTo === "0x0000000000000000000000000000000000000000" ? (
                        <span className="text-orange-400">{t('notDelegated')}</span>
                      ) : walletTokenInfo.delegatedTo === walletAddress ? (
                        <span className="text-green-400">Self</span>
                      ) : (
                        <span className="font-mono">{walletTokenInfo.delegatedTo.slice(0, 6)}...{walletTokenInfo.delegatedTo.slice(-4)}</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-base text-gray-400">{t('tokenInfoUnavailable')}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Connection Prompt */}
      {!isConnected && (
        <Card className="mb-6 border-dashed bg-muted hover:bg-muted/80">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-400">{t('walletNotConnected')}</h3>
                <p className="text-xs text-gray-400">{t('connectWalletToViewBalance')}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-orange-400">{t('pleaseConnectWallet')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {isLoadingActionable ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-gray-400">{t('loading')}</span>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-600 bg-transparent overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted/80 border-b border-gray-600">
                          <TableHead className="text-gray-300 pl-12 text-base font-medium min-w-[200px] whitespace-nowrap">{t('title')}</TableHead>
                          <TableHead className="text-gray-300 text-center pl-6 text-base font-medium min-w-[120px] whitespace-nowrap">{t('status')}</TableHead>
                          <TableHead className="text-gray-300 pl-20 text-base font-medium min-w-[150px] whitespace-nowrap">{t('progress')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('start')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('ends')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedActiveProposals.length > 0 ? (
                          paginatedActiveProposals.map((proposal) => (
                            <TableRow 
                              key={proposal.id} 
                              className="border-0 hover:bg-gray-800/30 cursor-pointer"
                              onClick={() => router.push(createProposalUrl(proposal))}
                            >
                              <TableCell className="max-w-xs py-6 min-w-[200px] whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-100 truncate">{proposal.title}</h3>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-6 min-w-[120px] whitespace-nowrap">
                                <StatusBadge proposal={proposal} />
                              </TableCell>
                              <TableCell className="min-w-52 py-6 min-w-[150px] whitespace-nowrap">
                                <ProgressBar 
                                  votesFor={proposal.votesFor} 
                                  votesAgainst={proposal.votesAgainst} 
                                  abstain={proposal.abstain}
                                />
                              </TableCell>
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.startTime)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.endTime)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                              {t('noActiveProposalsFound')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationComponent 
                    currentPage={activeProposalsPage}
                    totalPages={totalActivePages}
                    onPageChange={setActiveProposalsPage}
                  />
                  <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                    <div className="flex justify-between items-center">
                      {(actionableCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                        <div>
                          {t('showing')} {((activeProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(activeProposalsPage * ITEMS_PER_PAGE, actionableCount?.proposals?.length || 0)} {t('of')} {actionableCount?.proposals?.length || 0} {t('proposals')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
              {isLoadingCompletedByStatus ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-gray-400">{t('loading')}</span>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-600 bg-transparent overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted/80 border-b border-gray-600">
                          <TableHead className="text-gray-300 pl-12 text-base font-medium min-w-[200px] whitespace-nowrap">{t('title')}</TableHead>
                          <TableHead className="text-gray-300 text-center pl-6 text-base font-medium min-w-[120px] whitespace-nowrap">{t('status')}</TableHead>
                          <TableHead className="text-gray-300 pl-20 text-base font-medium min-w-[150px] whitespace-nowrap">{t('progress')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('start')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('ends')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCompletedProposals.length > 0 ? (
                          paginatedCompletedProposals.map((proposal) => (
                            <TableRow 
                              key={proposal.id} 
                              className="border-0 hover:bg-gray-800/30 cursor-pointer"
                              onClick={() => router.push(createProposalUrl(proposal))}
                            >
                              <TableCell className="max-w-xs py-6 min-w-[200px] whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-100 truncate">{proposal.title}</h3>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-6 min-w-[120px] whitespace-nowrap">
                                <StatusBadge proposal={proposal} />
                              </TableCell>
                              <TableCell className="min-w-52 py-6 min-w-[150px] whitespace-nowrap">
                                <ProgressBar 
                                  votesFor={proposal.votesFor} 
                                  votesAgainst={proposal.votesAgainst} 
                                  abstain={proposal.abstain}
                                />
                              </TableCell> 
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.startTime)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.endTime)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                              {t('noCompletedProposalsFound')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationComponent 
                    currentPage={completedProposalsPage}
                    totalPages={totalCompletedPages}
                    onPageChange={setCompletedProposalsPage}
                  />
                  <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      {(completedCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                        <div>
                          {t('showing')} {((completedProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(completedProposalsPage * ITEMS_PER_PAGE, completedCount?.proposals?.length || 0)} {t('of')} {completedCount?.proposals?.length || 0} {t('proposals')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
              {isLoadingAllByStatus ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-gray-400">{t('loading')}</span>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-600 bg-transparent overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted/80 border-b border-gray-600">
                          <TableHead className="text-gray-300 pl-12 text-base font-medium min-w-[200px] whitespace-nowrap">{t('title')}</TableHead>
                          <TableHead className="text-gray-300 text-center pl-6 text-base font-medium min-w-[120px] whitespace-nowrap">{t('status')}</TableHead>
                          <TableHead className="text-gray-300 pl-20 text-base font-medium min-w-[150px] whitespace-nowrap">{t('progress')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('start')}</TableHead>
                          <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('ends')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAllProposals.length > 0 ? (
                          paginatedAllProposals.map((proposal) => (
                            <TableRow 
                              key={proposal.id} 
                              className="border-0 hover:bg-gray-800/30 cursor-pointer"
                              onClick={() => router.push(createProposalUrl(proposal))}
                            >
                              <TableCell className="max-w-xs py-6 min-w-[200px] whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-100 truncate">{proposal.title}</h3>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-6 min-w-[120px] whitespace-nowrap">
                                <StatusBadge proposal={proposal} />
                              </TableCell>
                              <TableCell className="min-w-52 py-6 min-w-[150px] whitespace-nowrap">
                                <ProgressBar 
                                  votesFor={proposal.votesFor} 
                                  votesAgainst={proposal.votesAgainst} 
                                  abstain={proposal.abstain}
                                />
                              </TableCell>
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.startTime)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                                {formatDate(proposal.endTime)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                              {t('noProposalsFound')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationComponent 
                    currentPage={allProposalsPage}
                    totalPages={totalAllPages}
                    onPageChange={setAllProposalsPage}
                  />
                  <div className="mt-4 text-sm text-gray-400 border-t border-gray-700/50 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      {(allCount?.proposals?.length || 0) > ITEMS_PER_PAGE && (
                        <div>
                          {t('showing')} {((allProposalsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(allProposalsPage * ITEMS_PER_PAGE, allCount?.proposals?.length || 0)} {t('of')} {allCount?.proposals?.length || 0} {t('proposals')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="default" 
              size="lg"
              onClick={handleRefresh}
              disabled={isInitialLoading || isCurrentTabLoading} 
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-base border-orange-500 hover:border-orange-600 disabled:border-orange-500/50"
            >
              {isInitialLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-5 w-5" />
                  {t('refresh')}
                </>
              )}
            </Button>
            <Link href="/vote/create">
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
      </div>
      )}
    </div>
  )
} 