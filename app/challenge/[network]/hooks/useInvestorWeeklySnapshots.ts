import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders } from '@/lib/constants'

// GraphQL query for Investor weekly snapshots
export const INVESTOR_WEEKLY_SNAPSHOTS_QUERY = gql`
  query GetInvestorWeeklySnapshots($challengeId: String!, $investor: Bytes!, $first: Int!, $orderBy: InvestorWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    investorWeeklySnapshots(
      where: { challengeId: $challengeId, investor: $investor }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      challengeId
      timestamp
      investor
      seedMoneyUSD
      currentUSD
      tokens
      tokensAmount
      tokensDecimals
      tokensSymbols
      profitRatio
    }
  }
`

export interface InvestorWeeklySnapshot {
  id: string
  challengeId: string
  timestamp: string
  investor: string
  seedMoneyUSD: string
  currentUSD: string
  tokens: string[]
  tokensAmount: string[]
  tokensDecimals: string[]
  tokensSymbols: string[]
  profitRatio: string
}

export interface InvestorWeeklySnapshotsData {
  investorWeeklySnapshots: InvestorWeeklySnapshot[]
}

export function useInvestorWeeklySnapshots(challengeId: string, investor: string, limit: number = 30, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<InvestorWeeklySnapshotsData>({
    queryKey: ['investorWeeklySnapshots', challengeId, investor, limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        INVESTOR_WEEKLY_SNAPSHOTS_QUERY, 
        {
          challengeId,
          investor,
          first: limit,
          orderBy: 'timestamp',
          orderDirection: 'asc'
        }, 
        getChallengeHeaders()
      )
    },
    staleTime: 300000, // 5 minutes - snapshots don't change frequently
    gcTime: 600000, // 10 minutes - keep data in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!(challengeId && investor), // Only run query if both challengeId and investor are provided
  })
} 