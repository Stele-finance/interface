'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { NETWORK_SUBGRAPHS } from '@/lib/constants'

const FUND_INVESTOR_SNAPSHOTS_QUERY = gql`
  query GetFundInvestorSnapshots($fundId: String!, $investor: String!, $first: Int = 100) {
    investorSnapshots(
      where: { fundId: $fundId, investor: $investor }
      first: $first
      orderBy: timestamp
      orderDirection: asc
    ) {
      id
      timestamp
      fundId
      manager
      investor
      principalETH
      principalUSD
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmountETH
      tokensAmountUSD
      currentETH
      currentUSD
    }
  }
`

const headers = { 
  Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY 
}

export interface FundInvestorSnapshot {
  id: string
  timestamp: string
  fundId: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: string[]
  tokensAmountETH: string[]
  tokensAmountUSD: string[]
  currentETH: string
  currentUSD: string
}

export interface FundInvestorSnapshotsResponse {
  investorSnapshots: FundInvestorSnapshot[]
}

export function useFundInvestorSnapshots(fundId: string, investor: string, network: 'ethereum' | 'arbitrum' = 'arbitrum', first: number = 100) {
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund
  
  return useQuery<FundInvestorSnapshotsResponse>({
    queryKey: ['fundInvestorSnapshots', fundId, investor, network, first],
    queryFn: async (): Promise<FundInvestorSnapshotsResponse> => {
      try {
        const result = await request<FundInvestorSnapshotsResponse>(url, FUND_INVESTOR_SNAPSHOTS_QUERY, { 
          fundId, 
          investor: investor.toLowerCase(),
          first 
        }, headers)
        console.log('FundInvestorSnapshots GraphQL response:', result)
        
        return result
      } catch (error) {
        console.error('Error fetching fund investor snapshots data:', error)
        throw error
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!fundId && !!investor, // Only run when both are available
  })
}