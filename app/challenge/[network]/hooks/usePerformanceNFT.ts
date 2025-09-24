'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, getChallengeHeaders } from '@/lib/constants'

const GET_PERFORMANCE_NFT_QUERY = `
  query GetPerformanceNFT($challengeId: String!, $user: String!) {
    performanceNFTs(
      where: { challengeId: $challengeId, user: $user }
      first: 1
    ) {
      id
      tokenId
      challengeId
      user
      rank
      returnRate
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

export interface PerformanceNFTData {
  id: string
  tokenId: string
  challengeId: string
  user: string
  rank: number
  returnRate: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

interface GraphQLResponse {
  performanceNFTs: PerformanceNFTData[]
}

export function usePerformanceNFT(challengeId: string, userAddress: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery({
    queryKey: ['performanceNFT', challengeId, userAddress, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_PERFORMANCE_NFT_QUERY, {
          challengeId: challengeId,
          user: userAddress.toLowerCase()
        }, getChallengeHeaders())

        if (!data || !data.performanceNFTs) {
          return null
        }

        return data.performanceNFTs.length > 0 ? data.performanceNFTs[0] : null
      } catch (error) {
        console.error('❌ Error fetching performance NFT:', error)
        return null
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!(challengeId && userAddress), // Only run if both are provided
  })
}