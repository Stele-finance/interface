'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'

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
      share
      amountUSD
      profitUSD
      profitRatio
    }
  }
`

const headers = getFundHeaders()

export interface FundInvestorSnapshot {
  id: string
  timestamp: string
  fundId: string
  manager: string
  investor: string
  share: string  // BigInt from subgraph but treated as string in GraphQL
  amountUSD: string
  profitUSD: string
  profitRatio: string
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