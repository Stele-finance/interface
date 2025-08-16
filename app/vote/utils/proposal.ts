import { ethers } from "ethers"
import { Proposal, BlockInfo } from "../components/types"
import { STELE_DECIMALS, getBlockTimeSeconds, convertVotingPeriodToNetwork, KNOWN_GOVERNANCE_CONFIGS } from "@/lib/constants"

// Parse proposal details from description
export const parseProposalDetails = (description: string) => {
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

// Simple status determination
export const getProposalStatus = (voteStart: string, voteEnd: string): 'active' | 'completed' | 'rejected' => {
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

// Calculate timestamp for any block number based on current block info
export const calculateBlockTimestamp = (
  targetBlockNumber: string, 
  currentBlockInfo: BlockInfo | null, 
  network: string = 'ethereum'
): number => {
  if (!currentBlockInfo) {
    console.warn('No current block info available for timestamp calculation')
    return Date.now() / 1000 // Return current time as fallback
  }
  
  const targetBlock = parseInt(targetBlockNumber)
  const blockDifference = targetBlock - currentBlockInfo.blockNumber
  
  // Use network-specific block time
  const BLOCK_TIME_SECONDS = getBlockTimeSeconds(network)
  const estimatedTimestamp = currentBlockInfo.timestamp + (blockDifference * BLOCK_TIME_SECONDS)
  return estimatedTimestamp
}

// Helper function to process proposal data
export const processProposalData = (
  proposalData: any, 
  voteResultsData: any,
  currentBlockInfo: BlockInfo | null,
  forceStatus?: 'pending' | 'active' | 'pending_queue' | 'queued' | 'executed' | 'canceled' | 'defeated',
  network: string = 'ethereum'
): Proposal => {
  const details = parseProposalDetails(proposalData.description)
  
  // Find vote result for this proposal first
  const voteResult = voteResultsData?.proposalVoteResults?.find(
    (result: any) => result.id === proposalData.proposalId
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
    startTimestamp = calculateBlockTimestamp(proposalData.voteStart, currentBlockInfo, network)
    endTimestamp = calculateBlockTimestamp(proposalData.voteEnd, currentBlockInfo, network)
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
export const processStatusBasedProposalData = (
  proposalData: any,
  currentBlockInfo: BlockInfo | null,
  governanceConfig?: any,
  network: string = 'ethereum',
  isLoadingGovernanceConfig: boolean = false
): Proposal => {
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
    const startTimestamp = calculateBlockTimestamp(proposalData.voteStart, currentBlockInfo, network)
    const endTimestamp = calculateBlockTimestamp(proposalData.voteEnd, currentBlockInfo, network)
    startTime = new Date(startTimestamp * 1000)
    endTime = new Date(endTimestamp * 1000)
  } else {
    // Fallback to estimated periods based on status and timestamps
    // Prefer actual governance config from contract, only use defaults as last resort
    let votingPeriodBlocks: number
    let votingDelayBlocks: number
    
    // Get known config for the network
    const knownConfig = KNOWN_GOVERNANCE_CONFIGS[network as keyof typeof KNOWN_GOVERNANCE_CONFIGS] || KNOWN_GOVERNANCE_CONFIGS.ethereum
    
    if (governanceConfig?.votingPeriod && governanceConfig?.votingDelay) {
      // Use actual governance config from contract (preferred)
      votingPeriodBlocks = governanceConfig.votingPeriod
      votingDelayBlocks = governanceConfig.votingDelay
    } else {
      // Use known configurations (whether loading or failed)
      // This reduces API dependency and prevents rate limiting
      votingPeriodBlocks = knownConfig.votingPeriod
      votingDelayBlocks = knownConfig.votingDelay
    }
    
    // Convert blocks to milliseconds using network-specific block time
    const BLOCK_TIME_MS = getBlockTimeSeconds(network) * 1000
    const votingPeriodMs = votingPeriodBlocks * BLOCK_TIME_MS
    const votingDelayMs = votingDelayBlocks * BLOCK_TIME_MS
    
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

// Helper function to determine if voting is currently active
export const isVotingActive = (proposal: Proposal): boolean => {
  const now = Date.now()
  const startTime = proposal.startTime.getTime()
  const endTime = proposal.endTime.getTime()
  
  // Voting is active if current time is between start and end time
  return now >= startTime && now <= endTime
}

// Format date in a readable way with time
export const formatDate = (date: Date): string => {
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
export const createProposalUrl = (proposal: Proposal, walletTokenInfo?: any, network: string = 'ethereum'): string => {
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
  
  return `/vote/${network}/${proposal.id}?${params.toString()}`
} 