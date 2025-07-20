// Interface for proposal data
export interface Proposal {
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

export interface StatusBadgeProps {
  proposal: Proposal;
  t: (key: any) => string;
}

export interface ProgressBarProps {
  votesFor: number;
  votesAgainst: number;
  abstain: number;
}

export interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface WalletTokenInfoProps {
  isConnected: boolean;
  isLoadingWalletTokenInfo: boolean;
  walletTokenInfo: any;
  walletAddress?: string;
  isDelegating: boolean;
  onDelegate: () => void;
  t: (key: any) => string;
}

export interface ProposalTableProps {
  proposals: Proposal[];
  onProposalClick: (proposal: Proposal) => void;
  formatDate: (date: Date) => string;
  t: (key: any) => string;
  isLoading?: boolean;
  emptyMessage: string;
}

export interface TabContentProps {
  tabType: 'active' | 'completed' | 'all';
  currentTab: string;
  proposals: Proposal[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onProposalClick: (proposal: Proposal) => void;
  formatDate: (date: Date) => string;
  t: (key: any) => string;
  itemsPerPage: number;
}

export interface WalletTokenInfo {
  formattedBalance: string;
  delegatedTo: string;
}

export interface BlockInfo {
  blockNumber: number;
  timestamp: number;
}

export interface ProcessedProposalData {
  proposals: Proposal[];
  isLoading: boolean;
  error: any;
}

export interface VotePageState {
  proposals: Proposal[];
  activeProposals: Proposal[];
  completedProposals: Proposal[];
  isInitialLoading: boolean;
  isDelegating: boolean;
  currentTab: string;
  activeProposalsPage: number;
  completedProposalsPage: number;
  allProposalsPage: number;
  mountTimestamp: number;
  recentlyCreatedProposal: any;
  hasCheckedForNewProposal: boolean;
}

export interface UseVotePageLogicProps {
  network: string;
  walletAddress?: string;
  isConnected: boolean;
  walletType?: string;
  getProvider: () => any;
}

export interface UseVotePageLogicReturn extends VotePageState {
  // Actions
  handleTabChange: (tab: string) => void;
  handleRefresh: () => Promise<void>;
  handleDelegate: () => Promise<void>;
  createProposalUrl: (proposal: Proposal) => string;
  formatDate: (date: Date) => string;
  
  // Data loading states
  isCurrentTabLoading: boolean;
  totalActivePages: number;
  totalCompletedPages: number;
  totalAllPages: number;
  
  // Data counts
  actionableCount?: any;
  completedCount?: any;
  allCount?: any;
  
  // Wallet info
  walletTokenInfo?: WalletTokenInfo;
  isLoadingWalletTokenInfo: boolean;
  
  // Error states
  hasError: boolean;
  errorMessage: string;
} 