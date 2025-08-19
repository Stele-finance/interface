import { NETWORK_SUBGRAPHS } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

const FUND_SNAPSHOTS_QUERY = gql`
  query GetFundSnapshots($fundId: String!, $first: Int = 100) {
    fundSnapshots(
      where: { fundId: $fundId }
      first: $first
      orderBy: timestamp
      orderDirection: asc
    ) {
      id
      timestamp
      fundId
      manager
      investorCount
      currentETH
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
      currentTokensAmountETH
      currentTokensAmountUSD
    }
  }
`

const headers = { 
  Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY 
}

export interface FundSnapshot {
  id: string
  timestamp: string
  fundId: string
  manager: string
  investorCount: string
  currentETH: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
  currentTokensAmountETH: string[]
  currentTokensAmountUSD: string[]
}

export interface FundSnapshotsResponse {
  fundSnapshots: FundSnapshot[]
}

export function useFundSnapshots(fundId: string, network: 'ethereum' | 'arbitrum' = 'arbitrum', first: number = 100) {
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund
  
  return useQuery<FundSnapshotsResponse>({
    queryKey: ['fundSnapshots', fundId, network, first],
    queryFn: async (): Promise<FundSnapshotsResponse> => {
      try {
        const result = await request<FundSnapshotsResponse>(url, FUND_SNAPSHOTS_QUERY, { 
          fundId, 
          first 
        }, headers)
        console.log('FundSnapshots GraphQL response:', result)
        
        // Return actual data (even if empty)
        return result
      } catch (error) {
        console.error('Error fetching fund snapshots data:', error)
        throw error
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}