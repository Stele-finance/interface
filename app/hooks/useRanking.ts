'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl } from '@/lib/constants'

const GET_RANKING_QUERY = `
  query GetRanking($challengeId: String!) {
    ranking(id: $challengeId) {
      id
      challengeId
      seedMoney
      topUsers
      scores
      profitRatios
      updatedAtTimestamp
      updatedAtBlockNumber
      updatedAtTransactionHash
    }
  }
`

export interface RankingData {
  id: string
  challengeId: string
  seedMoney: string
  topUsers: string[]
  scores: string[]
  profitRatios: string[]
  updatedAtTimestamp: string
  updatedAtBlockNumber: string
  updatedAtTransactionHash: string
}

interface GraphQLResponse {
  ranking?: RankingData
}

export function useRanking(challengeId: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery({
    queryKey: ['ranking', challengeId, network],
    queryFn: async (): Promise<RankingData | null> => {
      try {
        const data = await request<GraphQLResponse>(
          subgraphUrl,
          GET_RANKING_QUERY,
          { challengeId }
        )
        
        return data.ranking || null
      } catch (error) {
        console.error('Error fetching ranking data:', error)
        throw error
      }
    },
    enabled: !!challengeId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })
} 