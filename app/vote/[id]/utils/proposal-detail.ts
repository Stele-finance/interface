import { ethers } from "ethers"
import { 
  NetworkType, 
  ProposalStatus, 
  ProposalState, 
  CachedProposalData,
  ProposalTimestamps,
  ScanSiteInfo,
  TimelineItem
} from "../components/types"
import { STELE_DECIMALS } from "@/lib/constants"

// Helper function to get scan site URL based on network
export const getScanSiteUrl = (network: NetworkType | null): string => {
  switch (network) {
    case 'ethereum':
      return 'https://etherscan.io'
    case 'arbitrum':
      return 'https://arbiscan.io'
    default:
      return 'https://etherscan.io' // default to ethereum
  }
}

// Helper function to get scan site info
export const getScanSiteInfo = (network: NetworkType | null): ScanSiteInfo => {
  const baseUrl = getScanSiteUrl(network)
  
  return {
    baseUrl,
    txUrl: (hash: string) => `${baseUrl}/tx/${hash}`,
    addressUrl: (address: string) => `${baseUrl}/address/${address}`,
    blockUrl: (block: string) => `${baseUrl}/block/${block}`
  }
}

// Helper function to open scan site in new tab
export const openScanSite = (
  network: NetworkType | null, 
  type: 'tx' | 'address' | 'block', 
  value: string
): void => {
  const scanInfo = getScanSiteInfo(network)
  
  let url = ''
  switch (type) {
    case 'tx':
      url = scanInfo.txUrl(value)
      break
    case 'address':
      url = scanInfo.addressUrl(value)
      break
    case 'block':
      url = scanInfo.blockUrl(value)
      break
  }
  
  if (url) {
    window.open(url, '_blank')
  }
}

// Parse cached proposal data from URL search params
export const parseCachedProposalData = (searchParams: URLSearchParams): CachedProposalData | null => {
  const title = searchParams.get('title')
  const description = searchParams.get('description')
  const proposer = searchParams.get('proposer')
  const status = searchParams.get('status')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')
  const votesFor = searchParams.get('votesFor')
  const votesAgainst = searchParams.get('votesAgainst')
  const abstain = searchParams.get('abstain')
  const blockTimestamp = searchParams.get('blockTimestamp')
  const blockNumber = searchParams.get('blockNumber')
  const values = searchParams.get('values')
  const transactionHash = searchParams.get('transactionHash')
  const tokenBalance = searchParams.get('tokenBalance')
  const delegatedTo = searchParams.get('delegatedTo')

  // Return cached data if available
  if (title && description && proposer && status && startTime && endTime && 
      votesFor && votesAgainst && abstain && blockTimestamp && blockNumber && 
      values && transactionHash && tokenBalance && delegatedTo) {
    return {
      title,
      description,
      proposer,
      status,
      startTime,
      endTime,
      votesFor,
      votesAgainst,
      abstain,
      blockTimestamp,
      blockNumber,
      values,
      transactionHash,
      tokenBalance,
      delegatedTo
    }
  }

  return null
}

// Map numeric proposal state to string status
export const mapProposalStateToStatus = (state: ProposalState): ProposalStatus => {
  switch (state) {
    case 0: return 'pending'    // Pending
    case 1: return 'active'     // Active
    case 2: return 'canceled'   // Canceled
    case 3: return 'defeated'   // Defeated
    case 4: return 'succeeded'  // Succeeded
    case 5: return 'queued'     // Queued
    case 6: return 'expired'    // Expired
    case 7: return 'executed'   // Executed
    default: return 'pending'   // Default fallback
  }
}

// Calculate timestamps from block numbers
export const calculateProposalTimestamps = (
  startBlock: string,
  endBlock: string,
  currentBlockNumber?: number,
  currentBlockTimestamp?: number
): ProposalTimestamps => {
  // Default Ethereum block time (12 seconds per block)
  const ETHEREUM_BLOCK_TIME_SECONDS = 12
  
  // If we have current block info, calculate based on block differences
  if (currentBlockNumber && currentBlockTimestamp) {
    const startBlockDiff = parseInt(startBlock) - currentBlockNumber
    const endBlockDiff = parseInt(endBlock) - currentBlockNumber
    
    const startTimestamp = currentBlockTimestamp + (startBlockDiff * ETHEREUM_BLOCK_TIME_SECONDS)
    const endTimestamp = currentBlockTimestamp + (endBlockDiff * ETHEREUM_BLOCK_TIME_SECONDS)
    
    return {
      startTime: new Date(startTimestamp * 1000),
      endTime: new Date(endTimestamp * 1000)
    }
  }
  
  // Fallback: estimate based on current time
  const now = Date.now() / 1000
  const estimatedCurrentBlock = 18500000 // Rough estimate for current Ethereum block
  const startBlockDiff = parseInt(startBlock) - estimatedCurrentBlock
  const endBlockDiff = parseInt(endBlock) - estimatedCurrentBlock
  
  const startTimestamp = now + (startBlockDiff * ETHEREUM_BLOCK_TIME_SECONDS)
  const endTimestamp = now + (endBlockDiff * ETHEREUM_BLOCK_TIME_SECONDS)
  
  return {
    startTime: new Date(startTimestamp * 1000),
    endTime: new Date(endTimestamp * 1000)
  }
}

// Format voting power from wei to human-readable format
export const formatVotingPower = (votingPowerWei: string): string => {
  if (!votingPowerWei || votingPowerWei === '0') {
    return '0'
  }
  
  try {
    const formatted = ethers.formatUnits(votingPowerWei, STELE_DECIMALS)
    const number = parseFloat(formatted)
    
    // Round to 2 decimal places
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  } catch (error) {
    console.error('Error formatting voting power:', error)
    return '0'
  }
}

// Format vote counts from wei to human-readable format
export const formatVoteCount = (voteCountWei: string): string => {
  if (!voteCountWei || voteCountWei === '0') {
    return '0'
  }
  
  try {
    const formatted = ethers.formatUnits(voteCountWei, STELE_DECIMALS)
    const number = parseFloat(formatted)
    
    // Round to whole numbers for vote counts
    return Math.round(number).toLocaleString('en-US')
  } catch (error) {
    console.error('Error formatting vote count:', error)
    return '0'
  }
}

// Calculate vote percentages
export const calculateVotePercentages = (forVotes: string, againstVotes: string, abstainVotes: string) => {
  const forNum = parseFloat(formatVoteCount(forVotes))
  const againstNum = parseFloat(formatVoteCount(againstVotes))
  const abstainNum = parseFloat(formatVoteCount(abstainVotes))
  
  const total = forNum + againstNum + abstainNum
  
  if (total === 0) {
    return { forPercent: 0, againstPercent: 0, abstainPercent: 0 }
  }
  
  return {
    forPercent: Math.round((forNum / total) * 100),
    againstPercent: Math.round((againstNum / total) * 100),
    abstainPercent: Math.round((abstainNum / total) * 100)
  }
}

// Get status badge color and text
export const getStatusBadgeInfo = (status: ProposalStatus) => {
  switch (status) {
    case 'pending':
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    case 'active':
      return { color: 'bg-green-100 text-green-800', text: 'Active' }
    case 'canceled':
      return { color: 'bg-gray-100 text-gray-800', text: 'Canceled' }
    case 'defeated':
      return { color: 'bg-red-100 text-red-800', text: 'Defeated' }
    case 'succeeded':
      return { color: 'bg-blue-100 text-blue-800', text: 'Succeeded' }
    case 'queued':
      return { color: 'bg-purple-100 text-purple-800', text: 'Queued' }
    case 'expired':
      return { color: 'bg-orange-100 text-orange-800', text: 'Expired' }
    case 'executed':
      return { color: 'bg-green-100 text-green-800', text: 'Executed' }
    default:
      return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' }
  }
}

// Check if proposal can be queued
export const canQueueProposal = (status: ProposalStatus): boolean => {
  return status === 'succeeded'
}

// Check if proposal can be executed
export const canExecuteProposal = (status: ProposalStatus): boolean => {
  return status === 'queued'
}

// Check if proposal can be canceled
export const canCancelProposal = (status: ProposalStatus): boolean => {
  return status === 'pending' || status === 'active' || status === 'queued'
}

// Check if voting is currently active
export const isVotingActive = (status: ProposalStatus): boolean => {
  return status === 'active'
}

// Generate proposal timeline
export const generateProposalTimeline = (
  status: ProposalStatus,
  startTime: Date,
  endTime: Date
): TimelineItem[] => {
  const now = new Date()
  
  const timeline: TimelineItem[] = [
    {
      label: 'Proposal Created',
      date: startTime,
      status: 'completed',
      description: 'Proposal has been submitted to the governance system'
    },
    {
      label: 'Voting Period',
      date: startTime,
      status: now >= startTime && now <= endTime ? 'current' : 
              now > endTime ? 'completed' : 'upcoming',
      description: 'Community members can vote on this proposal'
    },
    {
      label: 'Voting Ends',
      date: endTime,
      status: now > endTime ? 'completed' : 'upcoming',
      description: 'Voting period concludes and results are finalized'
    }
  ]
  
  // Add status-specific timeline items
  if (status === 'succeeded' || status === 'queued' || status === 'executed') {
    timeline.push({
      label: 'Proposal Succeeded',
      date: endTime,
      status: 'completed',
      description: 'Proposal has passed and can be queued for execution'
    })
  }
  
  if (status === 'queued' || status === 'executed') {
    timeline.push({
      label: 'Proposal Queued',
      date: null, // Would need actual queue timestamp
      status: 'completed',
      description: 'Proposal has been queued in the timelock'
    })
  }
  
  if (status === 'executed') {
    timeline.push({
      label: 'Proposal Executed',
      date: null, // Would need actual execution timestamp
      status: 'completed',
      description: 'Proposal has been successfully executed'
    })
  }
  
  return timeline
}

// Parse proposal description to extract title
export const parseProposalDescription = (description: string) => {
  // Check if description has a title format "Title: Description"
  const colonIndex = description.indexOf(':')
  
  if (colonIndex > 0 && colonIndex < 100) { // Title shouldn't be too long
    const title = description.substring(0, colonIndex).trim()
    const content = description.substring(colonIndex + 1).trim()
    return { title, description: content }
  }
  
  // No title format found, use first 50 characters as title
  const title = description.length > 50 ? 
    description.substring(0, 47) + '...' : 
    description
  
  return { title, description }
}

// Format date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format time remaining until date
export const formatTimeRemaining = (targetDate: Date): string => {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Ended'
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
} 