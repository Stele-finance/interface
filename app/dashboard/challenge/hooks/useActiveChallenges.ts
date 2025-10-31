import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders, BYTE_ZERO } from '@/lib/constants'

// GraphQL query for active challenges (updated schema - 1 week only)
export const ACTIVE_CHALLENGES_QUERY = gql`{
  activeChallenges(id: "${BYTE_ZERO}") {
    id
    one_week_id
    one_week_startTime
    one_week_endTime
    one_week_investorCounter
    one_week_rewardAmountUSD
    one_week_isCompleted
  }
}`

export interface ActiveChallengesData {
  activeChallenges: {
    id: string
    one_week_id: string
    one_week_startTime: string
    one_week_endTime: string
    one_week_investorCounter: string
    one_week_rewardAmountUSD: string
    one_week_isCompleted: boolean
  }
}

export function useActiveChallenges(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<ActiveChallengesData>({
    queryKey: ['activeChallenges', network],
    queryFn: async () => {
      return await request(subgraphUrl, ACTIVE_CHALLENGES_QUERY, {}, getChallengeHeaders())
    },
    staleTime: 60000, // 1 minute - reduce frequency of refetches
    gcTime: 300000, // 5 minutes - keep data in cache longer
    retry: 3, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
} 