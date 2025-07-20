// Vote option types
export type VoteOption = 'for' | 'against' | 'abstain' | null

// Proposal status types
export type ProposalStatus = 'pending' | 'active' | 'canceled' | 'defeated' | 'succeeded' | 'queued' | 'expired' | 'executed'

// Proposal state from blockchain (numeric values)
export type ProposalState = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

// Interface for proposal details from GraphQL
export interface ProposalDetails {
  id: string
  proposalId: string
  proposer: string
  targets: string[]
  values: string[]
  signatures?: string[]
  calldatas: string[]
  startBlock: string
  endBlock: string
  description: string
  voteStart?: string
  voteEnd?: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

// Interface for proposal vote results
export interface ProposalVoteResults {
  id: string
  proposalId: string
  forVotes: string
  againstVotes: string
  abstainVotes: string
}

// Interface for cached proposal data from URL params
export interface CachedProposalData {
  title: string
  description: string
  proposer: string
  status: string
  startTime: string
  endTime: string
  votesFor: string
  votesAgainst: string
  abstain: string
  blockTimestamp: string
  blockNumber: string
  values: string
  transactionHash: string
  tokenBalance: string
  delegatedTo: string
}

// Interface for voting power info
export interface VotingPowerInfo {
  votingPower: string
  hasVoted: boolean
  isLoadingVotingPower: boolean
}

// Interface for proposal actions props
export interface ProposalActionsProps {
  id: string
  voteOption: VoteOption
  setVoteOption: (option: VoteOption) => void
  reason: string
  setReason: (reason: string) => void
  isVoting: boolean
  hasVoted: boolean
  votingPower: string
  walletConnected: boolean
  handleVote: () => Promise<void>
  handleDelegate: () => Promise<void>
  isDelegating: boolean
  t: (key: any) => string
}

// Interface for proposal header props
export interface ProposalHeaderProps {
  id: string
  proposalData: CachedProposalData | null
  t: (key: any) => string
}

// Interface for proposal stats props
export interface ProposalStatsProps {
  proposalData: CachedProposalData | null
  voteResultData: ProposalVoteResults | null
  currentState: ProposalStatus
  t: (key: any) => string
}

// Interface for proposal voting card props
export interface ProposalVotingCardProps {
  id: string
  voteOption: VoteOption
  setVoteOption: (option: VoteOption) => void
  reason: string
  setReason: (reason: string) => void
  isVoting: boolean
  hasVoted: boolean
  votingPower: string
  walletConnected: boolean
  handleVote: () => Promise<void>
  t: (key: any) => string
}

// Interface for admin actions props
export interface AdminActionsProps {
  id: string
  currentState: ProposalStatus
  isQueuing: boolean
  isExecuting: boolean
  isCanceling: boolean
  handleQueue: () => Promise<void>
  handleExecute: () => Promise<void>
  handleCancel: () => Promise<void>
  t: (key: any) => string
}

// Interface for blockchain interaction results
export interface BlockchainActionResult {
  success: boolean
  transactionHash?: string
  error?: string
}

// Interface for proposal timeline item
export interface TimelineItem {
  label: string
  date: Date | null
  status: 'completed' | 'current' | 'upcoming'
  description?: string
}

// Interface for contract interaction parameters
export interface ContractInteractionParams {
  proposalId: string
  targets: string[]
  values: string[]
  calldatas: string[]
  descriptionHash: string
}

// Interface for voting status
export interface VotingStatus {
  hasVoted: boolean
  userVote?: {
    support: number
    votes: string
    reason?: string
  }
}

// Interface for delegation status
export interface DelegationStatus {
  delegatedTo: string
  formattedBalance: string
  isDelegated: boolean
  canVote: boolean
}

// Component state interfaces
export interface ProposalDetailPageState {
  voteOption: VoteOption
  reason: string
  isVoting: boolean
  votingPower: string
  hasVoted: boolean
  isLoadingVotingPower: boolean
  isDelegating: boolean
  isQueuing: boolean
  isExecuting: boolean
  isCanceling: boolean
  currentState: ProposalStatus
  votingPowerAtSnapshot: string
  userVoteInfo: VotingStatus | null
  delegationInfo: DelegationStatus | null
}

// Network types
export type NetworkType = 'ethereum' | 'arbitrum'

// Utility function return types
export interface ProposalTimestamps {
  startTime: Date
  endTime: Date
}

export interface ScanSiteInfo {
  baseUrl: string
  txUrl: (hash: string) => string
  addressUrl: (address: string) => string
  blockUrl: (block: string) => string
} 