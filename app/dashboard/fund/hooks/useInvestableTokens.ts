import { NETWORK_SUBGRAPHS } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

const INVESTABLE_TOKENS_QUERY = gql`
  query GetInvestableTokens($first: Int = 50) {
    investableTokens(
      first: $first
      where: { isInvestable: true }
      orderBy: updatedTimestamp
      orderDirection: desc
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

// Use dynamic network based on parameter
const getSubgraphUrl = (network: 'ethereum' | 'arbitrum') => {
  return network === 'arbitrum' ? NETWORK_SUBGRAPHS.arbitrum_fund : NETWORK_SUBGRAPHS.ethereum_fund
}

const headers = { 
  Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY 
}

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

export function useInvestableTokens(first: number = 50, network: 'ethereum' | 'arbitrum' = 'ethereum') {
  return useQuery<InvestableTokensResponse>({
    queryKey: ['investableTokens', first, network],
    queryFn: async (): Promise<InvestableTokensResponse> => {
      try {
        const url = getSubgraphUrl(network)
        const result = await request<InvestableTokensResponse>(url, INVESTABLE_TOKENS_QUERY, { first }, headers)
        
        // Return actual data (even if empty)
        return result
      } catch (error) {
        console.error('Error fetching investable tokens data:', error)
        throw error
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}