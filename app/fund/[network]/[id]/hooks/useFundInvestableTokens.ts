'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'

const GET_INVESTABLE_TOKENS_QUERY = `
  query GetInvestableTokens {
    investableTokens(
      where: { 
        isInvestable: true
      }
      orderBy: symbol
      orderDirection: asc
      first: 100
    ) {
      id
      address
      decimals
      symbol
      updatedTimestamp
      isInvestable
    }
  }
`

export interface InvestableToken {
  id: string
  address: string
  decimals: string
  symbol: string
  updatedTimestamp: string
  isInvestable: boolean
}

export interface InvestableTokensResponse {
  investableTokens: InvestableToken[]
}

export function useFundInvestableTokens(network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Use Fund-specific subgraph URL
  const fundNetwork = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
  const subgraphUrl = NETWORK_SUBGRAPHS[fundNetwork]
  
  return useQuery({
    queryKey: ['fundInvestableTokens', network],
    queryFn: async () => {      
      try {
        const data = await request<InvestableTokensResponse>(subgraphUrl, GET_INVESTABLE_TOKENS_QUERY, {}, getFundHeaders())

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        return data.investableTokens || []
      } catch (error) {
        console.error('❌ Error fetching investable tokens:', error)
 
        // If there's a network error, try to provide more context
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        
        // Return empty array instead of throwing to prevent UI crashes
        return []
      }
    },
    staleTime: 300000, // 5 minutes (tokens don't change frequently)
    gcTime: 900000, // 15 minutes
  })
}