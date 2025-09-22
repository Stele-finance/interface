import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

// GraphQL query for investor monthly snapshots
export const INVESTOR_MONTHLY_SNAPSHOTS_QUERY = gql`
  query GetInvestorMonthlySnapshots($challengeId: String!, $investor: String!, $first: Int!, $orderBy: InvestorMonthlySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    investorMonthlySnapshots(
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

export interface InvestorMonthlySnapshot {
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

export interface InvestorMonthlySnapshotsData {
  investorMonthlySnapshots: InvestorMonthlySnapshot[]
}

export function useInvestorMonthlySnapshots(challengeId: string, investor: string, limit: number = 12, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<InvestorMonthlySnapshotsData>({
    queryKey: ['investorMonthlySnapshots', challengeId, investor, limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        INVESTOR_MONTHLY_SNAPSHOTS_QUERY, 
        {
          challengeId,
          investor: investor.toLowerCase(), // Ensure address is lowercase for GraphQL query
          first: limit,
          orderBy: 'timestamp',
          orderDirection: 'asc'
        }, 
        headers
      )
    },
    staleTime: 1800000, // 30 minutes - monthly snapshots don't change frequently
    gcTime: 3600000, // 60 minutes - keep data in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!challengeId && !!investor, // Only run query if both IDs are provided
  })
}