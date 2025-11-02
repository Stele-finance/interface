import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders } from '@/lib/constants'

// GraphQL query for Active Challenges Monthly snapshots
export const ACTIVE_CHALLENGES_MONTHLY_SNAPSHOTS_QUERY = gql`
  query GetActiveChallengesMonthlySnapshots($first: Int!, $orderBy: ActiveChallengesMonthlySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    activeChallengesMonthlySnapshots(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      totalParticipants
      totalRewards
      one_week_investorCounter
      one_week_rewardAmountUSD
      one_month_investorCounter
      one_month_rewardAmountUSD
      three_month_investorCounter
      three_month_rewardAmountUSD
      six_month_investorCounter
      six_month_rewardAmountUSD
      one_year_investorCounter
      one_year_rewardAmountUSD
    }
  }
`

export interface ActiveChallengesMonthlySnapshot {
  id: string
  timestamp: string
  totalParticipants: string
  totalRewards: string
  one_week_investorCounter: string
  one_week_rewardAmountUSD: string
  one_month_investorCounter: string
  one_month_rewardAmountUSD: string
  three_month_investorCounter: string
  three_month_rewardAmountUSD: string
  six_month_investorCounter: string
  six_month_rewardAmountUSD: string
  one_year_investorCounter: string
  one_year_rewardAmountUSD: string
}

export interface ActiveChallengesMonthlySnapshotsData {
  activeChallengesMonthlySnapshots: ActiveChallengesMonthlySnapshot[]
}

export function useActiveChallengesMonthlySnapshots(limit: number = 12, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<ActiveChallengesMonthlySnapshotsData>({
    queryKey: ['activeChallengesMonthlySnapshots', limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        ACTIVE_CHALLENGES_MONTHLY_SNAPSHOTS_QUERY, 
        {
          first: limit,
          orderBy: 'timestamp',
          orderDirection: 'asc'
        }, 
        getChallengeHeaders()
      )
    },
    staleTime: 1800000, // 30 minutes - monthly snapshots don't change frequently
    gcTime: 3600000, // 60 minutes - keep data in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}