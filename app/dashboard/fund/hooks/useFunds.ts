import { NETWORK_SUBGRAPHS } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

const FUNDS_QUERY = gql`
  query GetFunds($first: Int = 50) {
    funds(first: $first, orderBy: createdAtTimestamp, orderDirection: desc) {
      id
      fundId
      createdAtTimestamp
      updatedAtTimestamp
      manager
      investorCount
      share
      amountUSD
      profitUSD
      profitRatio
      feeTokens
      feeSymbols
      feeTokensAmount
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
    }
  }
`

const headers = { 
  Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY 
}

export interface Fund {
  id: string
  fundId: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  manager: string
  investorCount: string
  share: string
  amountUSD: string
  profitUSD: string
  profitRatio: string
  feeTokens: string[]
  feeSymbols: string[]
  feeTokensAmount: string[]
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: string[]
  tokensAmount: string[]
}

export interface FundsResponse {
  funds: Fund[]
}

export function useFunds(first: number = 50, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund
  
  return useQuery<FundsResponse>({
    queryKey: ['funds', first, network],
    queryFn: async (): Promise<FundsResponse> => {
      try {
        const result = await request<FundsResponse>(url, FUNDS_QUERY, { first }, headers)
        
        // Ensure we always return a valid response
        if (!result) {
          return { funds: [] }
        }
        
        return result
      } catch (error) {
        console.error('Error fetching funds data:', error)
        // Return empty data instead of throwing to prevent undefined
        return { funds: [] }
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}