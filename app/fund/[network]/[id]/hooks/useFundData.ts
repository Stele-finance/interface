import { NETWORK_SUBGRAPHS } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

const FUND_QUERY = gql`
  query GetFund($fundId: String!) {
    fund(id: $fundId) {
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

export interface FundResponse {
  fund: Fund | null
}

export function useFundData(fundId: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund
  
  return useQuery<FundResponse>({
    queryKey: ['fund', fundId, network],
    queryFn: async (): Promise<FundResponse> => {
      try {
        const result = await request<FundResponse>(url, FUND_QUERY, { fundId }, headers)
        
        return result
      } catch (error) {
        console.error('Error fetching fund data:', error)
        // Return null fund if not found
        return { fund: null }
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    enabled: !!fundId, // Only run when fundId is available
  })
}