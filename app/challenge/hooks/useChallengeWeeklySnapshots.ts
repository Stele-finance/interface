import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

// GraphQL query for Challenge weekly snapshots
export const CHALLENGE_WEEKLY_SNAPSHOTS_QUERY = gql`
  query GetChallengeWeeklySnapshots($challengeId: String!, $first: Int!, $orderBy: ChallengeWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    challengeWeeklySnapshots(
      where: { challengeId: $challengeId }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      challengeId
      timestamp
      investorCount
      rewardAmountUSD
      topUsers
      score
    }
  }
`

export interface ChallengeWeeklySnapshot {
  id: string
  challengeId: string
  timestamp: string
  investorCount: string
  rewardAmountUSD: string
  topUsers: string[]
  score: string[]
}

export interface ChallengeWeeklySnapshotsData {
  challengeWeeklySnapshots: ChallengeWeeklySnapshot[]
}

export function useChallengeWeeklySnapshots(challengeId: string, limit: number = 30, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<ChallengeWeeklySnapshotsData>({
    queryKey: ['challengeWeeklySnapshots', challengeId, limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        CHALLENGE_WEEKLY_SNAPSHOTS_QUERY, 
        {
          challengeId,
          first: limit,
          orderBy: 'timestamp',
          orderDirection: 'asc'
        }, 
        headers
      )
    },
    staleTime: 300000, // 5 minutes - snapshots don't change frequently
    gcTime: 600000, // 10 minutes - keep data in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!challengeId, // Only run query if challengeId is provided
  })
} 