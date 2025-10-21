import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'

// GraphQL queries for different investor snapshot types
const INVESTOR_SNAPSHOTS_QUERY = gql`
  query InvestorSnapshots($fundId: String!, $investor: Bytes!, $first: Int!, $orderBy: InvestorSnapshot_orderBy!, $orderDirection: OrderDirection!) {
    investorSnapshots(
      where: { fundId: $fundId, investor: $investor }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investor
      share
      investmentUSD
      amountUSD
      profitUSD
      profitRatio
    }
  }
`

const INVESTOR_WEEKLY_SNAPSHOTS_QUERY = gql`
  query InvestorWeeklySnapshots($fundId: String!, $investor: Bytes!, $first: Int!, $orderBy: InvestorWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    investorWeeklySnapshots(
      where: { fundId: $fundId, investor: $investor }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investor
      share
      investmentUSD
      amountUSD
      profitUSD
      profitRatio
    }
  }
`

const INVESTOR_MONTHLY_SNAPSHOTS_QUERY = gql`
  query InvestorMonthlySnapshots($fundId: String!, $investor: Bytes!, $first: Int!, $orderBy: InvestorMonthlySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    investorMonthlySnapshots(
      where: { fundId: $fundId, investor: $investor }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      timestamp
      fundId
      manager
      investor
      share
      investmentUSD
      amountUSD
      profitUSD
      profitRatio
    }
  }
`

export interface InvestorSnapshot {
  id: string
  timestamp: string
  fundId: string
  manager: string
  investor: string
  share: string  // BigInt from subgraph but treated as string in GraphQL
  investmentUSD: string  // Total invested amount (cumulative deposits)
  amountUSD: string
  profitUSD: string
  profitRatio: string
}

export type InvestorSnapshotType = 'daily' | 'weekly' | 'monthly'

export interface UseInvestorSnapshotsParams {
  fundId: string
  investor: string
  type: InvestorSnapshotType
  network: 'ethereum' | 'arbitrum'
  first?: number
}

export interface InvestorSnapshotsResponse {
  investorSnapshots: InvestorSnapshot[]
}

export function useInvestorSnapshots({ fundId, investor, type, network, first = 30 }: UseInvestorSnapshotsParams) {
  return useQuery<InvestorSnapshotsResponse>({
    queryKey: ['investorSnapshots', fundId, investor, type, network, first],
    queryFn: async (): Promise<InvestorSnapshotsResponse> => {
      try {
        // Use Fund-specific subgraph URL via getSubgraphUrl helper
        const subgraphUrl = getSubgraphUrl(network, 'fund')
        
        if (!subgraphUrl) {
          console.error('❌ No subgraph URL for network:', network)
          return { investorSnapshots: [] }
        }
      
        let query: string
        let orderBy: string
        
        switch (type) {
          case 'daily':
            query = INVESTOR_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          case 'weekly':
            query = INVESTOR_WEEKLY_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          case 'monthly':
            query = INVESTOR_MONTHLY_SNAPSHOTS_QUERY
            orderBy = 'timestamp'
            break
          default:
            throw new Error(`Unsupported snapshot type: ${type}`)
        }
        
        const variables = {
          fundId,
          investor: investor.toLowerCase(),
          first,
          orderBy,
          orderDirection: 'asc' as const
        }
        
        const response = await request(subgraphUrl, query, variables, getFundHeaders()) as any
        
        // Check if response is valid
        if (!response) {
          console.warn('GraphQL response is null or undefined')
          return { investorSnapshots: [] }
        }
        
        // Return the appropriate data based on type
        switch (type) {
          case 'daily':
            return { investorSnapshots: response?.investorSnapshots || [] }
          case 'weekly':
            return { investorSnapshots: response?.investorWeeklySnapshots || [] }
          case 'monthly':
            return { investorSnapshots: response?.investorMonthlySnapshots || [] }
          default:
            return { investorSnapshots: [] }
        }
      } catch (error) {
        console.error('❌ Error fetching investor snapshots:', error)
        return { investorSnapshots: [] }
      }
    },
    enabled: !!(fundId && investor && network),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Helper function to format investor snapshot data for charts
export function formatInvestorSnapshotDataForChart(snapshots: InvestorSnapshot[]) {
  return snapshots
    .slice()
    .map((snapshot) => ({
      date: new Date(parseInt(snapshot.timestamp) * 1000).toISOString().split('T')[0],
      timestamp: parseInt(snapshot.timestamp),
      amountUSD: parseFloat(snapshot.amountUSD),
      profitUSD: parseFloat(snapshot.profitUSD),
      profitRatio: parseFloat(snapshot.profitRatio),
      share: parseInt(snapshot.share),
    }))
}