'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

const GET_CHALLENGE_INVESTORS_QUERY = `
  query GetChallengeInvestors($challengeId: String!, $first: Int!) {
    investors(
      where: { challengeId: $challengeId }
      orderBy: currentUSD
      orderDirection: desc
      first: $first
    ) {
      id
      challengeId
      investor
      currentUSD
      isRegistered
      updatedAtTimestamp
    }
  }
`

export interface ChallengeInvestorData {
  id: string
  challengeId: string
  investor: string
  currentUSD: string
  isRegistered: boolean
  updatedAtTimestamp: string
}

interface GraphQLResponse {
  investors: Array<{
    id: string
    challengeId: string
    investor: string
    currentUSD: string
    isRegistered: boolean
    updatedAtTimestamp: string
  }>
}

export function useChallengeInvestors(challengeId: string, limit: number = 5, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery({
    queryKey: ['challengeInvestors', challengeId, limit, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_CHALLENGE_INVESTORS_QUERY, {
          challengeId: challengeId,
          first: limit
        }, headers)

        // Check if data is valid
        if (!data || !data.investors) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        return data.investors
      } catch (error) {
        console.error('❌ Error fetching challenge investors:', error)
        
        // If there's a network error, try to provide more context
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        
        // Return empty array instead of throwing to prevent UI crashes
        return []
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!(challengeId), // Only run if challengeId is provided
  })
} 