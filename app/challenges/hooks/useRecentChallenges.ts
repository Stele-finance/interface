import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders } from '@/lib/constants'

// GraphQL query with pagination support and total count
const getRecentChallengesQuery = (skip: number, first: number) => gql`{
  challenges(
    first: ${first}
    skip: ${skip}
    orderBy: challengeId
    orderDirection: desc
    where: { startTime_gt: "0" }
  ) {
    id
    challengeId
    challengeType
    startTime
    endTime
    investorCounter
    seedMoney
    entryFee
    rewardAmountUSD
    isActive
    topUsers
    score
  }
  challengesTotal: challenges(
    where: { startTime_gt: "0" }
  ) {
    id
  }
}`

export interface RecentChallenge {
  id: string
  challengeId: string
  challengeType: string
  startTime: string
  endTime: string
  investorCounter: string
  seedMoney: string
  entryFee: string
  rewardAmountUSD: string
  isActive: boolean
  topUsers: string[]
  score: string
}

export interface RecentChallengesData {
  challenges: RecentChallenge[]
  challengesTotal: { id: string }[]
}

export function useRecentChallenges(
  network: 'ethereum' | 'arbitrum' | null = 'ethereum',
  page: number = 1,
  itemsPerPage: number = 5
) {
  const subgraphUrl = getSubgraphUrl(network)
  const skip = (page - 1) * itemsPerPage

  return useQuery<RecentChallengesData>({
    queryKey: ['recentChallenges', network, page, itemsPerPage],
    queryFn: async () => {
      const query = getRecentChallengesQuery(skip, itemsPerPage)
      return await request(subgraphUrl, query, {}, getChallengeHeaders())
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
} 