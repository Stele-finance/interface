import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

// GraphQL queries for different fund snapshot types
const FUND_SNAPSHOTS_QUERY = gql`
  query FundSnapshots($fundId: String!, $first: Int!, $orderBy: FundSnapshot_orderBy!, $orderDirection: OrderDirection!) {
    fundSnapshots(
      where: { fundId: $fundId }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investorCount
      share
      amountUSD
      profitUSD
      profitRatio
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
      tokensAmountUSD
    }
  }
`

const FUND_WEEKLY_SNAPSHOTS_QUERY = gql`
  query FundWeeklySnapshots($fundId: String!, $first: Int!, $orderBy: FundWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    fundWeeklySnapshots(
      where: { fundId: $fundId }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investorCount
      share
      amountUSD
      profitUSD
      profitRatio
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
      tokensAmountUSD
    }
  }
`

const FUND_MONTHLY_SNAPSHOTS_QUERY = gql`
  query FundMonthlySnapshots($fundId: String!, $first: Int!, $orderBy: FundMonthlySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    fundMonthlySnapshots(
      where: { fundId: $fundId }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investorCount
      share
      amountUSD
      profitUSD
      profitRatio
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
      tokensAmountUSD
    }
  }
`

export interface FundSnapshot {
  id: string
  timestamp: string
  fundId: string
  manager: string
  investorCount: string
  share: string
  amountUSD: string
  profitUSD: string
  profitRatio: string
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: string[]
  tokensAmount: string[]
  tokensAmountUSD: string[]
}

export type FundSnapshotType = 'daily' | 'weekly' | 'monthly'

export interface UseFundSnapshotsParams {
  fundId: string
  type: FundSnapshotType
  network: 'ethereum' | 'arbitrum'
  first?: number
}

export interface FundSnapshotsResponse {
  fundSnapshots: FundSnapshot[]
}

export function useFundSnapshots({ fundId, type, network, first = 30 }: UseFundSnapshotsParams) {
  return useQuery<FundSnapshotsResponse>({
    queryKey: ['fundSnapshots', fundId, type, network, first],
    queryFn: async (): Promise<FundSnapshotsResponse> => {
      try {
        // Use Fund-specific subgraph URL via getSubgraphUrl helper
        const subgraphUrl = getSubgraphUrl(network, 'fund')
        
        if (!subgraphUrl) {
          console.error('❌ No subgraph URL for network:', network)
          return { fundSnapshots: [] }
        }
      
        let query: string
        let orderBy: string
        
        switch (type) {
          case 'daily':
            query = FUND_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          case 'weekly':
            query = FUND_WEEKLY_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          case 'monthly':
            query = FUND_MONTHLY_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          default:
            throw new Error(`Unsupported snapshot type: ${type}`)
        }
        
        const variables = {
          fundId,
          first,
          orderBy,
          orderDirection: 'asc' as const
        }
        
        const response = await request(subgraphUrl, query, variables, getFundHeaders()) as any
        
        // Check if response is valid
        if (!response) {
          console.warn('GraphQL response is null or undefined')
          return { fundSnapshots: [] }
        }
        
        // Return the appropriate data based on type
        switch (type) {
          case 'daily':
            return { fundSnapshots: response?.fundSnapshots || [] }
          case 'weekly':
            return { fundSnapshots: response?.fundWeeklySnapshots || [] }
          case 'monthly':
            return { fundSnapshots: response?.fundMonthlySnapshots || [] }
          default:
            return { fundSnapshots: [] }
        }
      } catch (error) {
        console.error('❌ Error fetching fund snapshots:', error)
        return { fundSnapshots: [] }
      }
    },
    enabled: !!(fundId && network),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Helper function to format fund snapshot data for charts
export function formatFundSnapshotDataForChart(snapshots: FundSnapshot[]) {
  return snapshots
    .slice()
    .map((snapshot) => ({
      date: new Date(parseInt(snapshot.timestamp) * 1000).toISOString().split('T')[0],
      timestamp: parseInt(snapshot.timestamp),
      tvl: parseFloat(snapshot.amountUSD),
      profit: parseFloat(snapshot.profitUSD),
      profitRatio: parseFloat(snapshot.profitRatio),
      investorCount: parseInt(snapshot.investorCount),
      share: parseInt(snapshot.share),
    }))
}