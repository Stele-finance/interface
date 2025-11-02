import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders } from '@/lib/constants'

// GraphQL query for Active Challenges Weekly snapshots
export const ACTIVE_CHALLENGES_WEEKLY_SNAPSHOTS_QUERY = gql`
  query GetActiveChallengesWeeklySnapshots($first: Int!, $orderBy: ActiveChallengesWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    activeChallengesWeeklySnapshots(
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

export interface ActiveChallengesWeeklySnapshot {
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

export interface ActiveChallengesWeeklySnapshotsData {
  activeChallengesWeeklySnapshots: ActiveChallengesWeeklySnapshot[]
}

export function useActiveChallengesWeeklySnapshots(limit: number = 30, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<ActiveChallengesWeeklySnapshotsData>({
    queryKey: ['activeChallengesWeeklySnapshots', limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        ACTIVE_CHALLENGES_WEEKLY_SNAPSHOTS_QUERY, 
        {
          first: limit,
          orderBy: 'timestamp',
          orderDirection: 'asc'
        }, 
        getChallengeHeaders()
      )
    },
    staleTime: 600000, // 10 minutes - weekly snapshots don't change frequently
    gcTime: 1200000, // 20 minutes - keep data in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
} 