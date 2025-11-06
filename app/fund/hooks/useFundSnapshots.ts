import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

const FUND_SNAPSHOTS_QUERY = gql`
  query GetFundSnapshots($fundId: String!, $first: Int = 30) {
    fundSnapshots(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { fundId: $fundId }
    ) {
      id
      timestamp
      amountUSD
      profitRatio
    }
  }
`

const headers = getFundHeaders()

export interface FundSnapshot {
  id: string
  timestamp: string
  amountUSD: string
  profitRatio: string
}

export interface FundSnapshotsResponse {
  fundSnapshots: FundSnapshot[]
}

export function useFundSnapshots(fundId: string, network: 'ethereum' | 'arbitrum' = 'ethereum') {
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund

  return useQuery<FundSnapshotsResponse>({
    queryKey: ['fundSnapshots', fundId, network],
    queryFn: async (): Promise<FundSnapshotsResponse> => {
      try {
        if (network !== 'ethereum') {
          return { fundSnapshots: [] }
        }

        const result = await request<FundSnapshotsResponse>(
          url,
          FUND_SNAPSHOTS_QUERY,
          { fundId, first: 30 },
          headers
        )

        if (!result) {
          return { fundSnapshots: [] }
        }

        return result
      } catch (error) {
        console.error('Error fetching fund snapshots:', error)
        return { fundSnapshots: [] }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!fundId,
  })
}
