import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

// GraphQL queries for different snapshot types
const INFO_SNAPSHOTS_QUERY = gql`
  query InfoSnapshots($first: Int!, $orderBy: InfoSnapshot_orderBy!, $orderDirection: OrderDirection!) {
    infoSnapshots(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      timestamp
      fundCount
      investorCount
      totalAmountUSD
    }
  }
`

const INFO_WEEKLY_SNAPSHOTS_QUERY = gql`
  query InfoWeeklySnapshots($first: Int!, $orderBy: InfoWeeklySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    infoWeeklySnapshots(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      timestamp
      fundCount
      investorCount
      totalAmountUSD
    }
  }
`

const INFO_MONTHLY_SNAPSHOTS_QUERY = gql`
  query InfoMonthlySnapshots($first: Int!, $orderBy: InfoMonthlySnapshot_orderBy!, $orderDirection: OrderDirection!) {
    infoMonthlySnapshots(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      timestamp
      fundCount
      investorCount
      totalAmountUSD
    }
  }
`

export interface InfoSnapshot {
  id: string
  timestamp: string
  fundCount: string
  investorCount: string
  totalAmountUSD: string
}

export type SnapshotType = 'daily' | 'weekly' | 'monthly'

export interface UseInfoSnapshotsParams {
  type: SnapshotType
  network: 'ethereum' | 'arbitrum'
  first?: number
}

export function useInfoSnapshots({ type, network, first = 30 }: UseInfoSnapshotsParams) {
  return useQuery({
    queryKey: ['infoSnapshots', type, network, first],
    queryFn: async () => {
      try {
        // Use Fund-specific subgraph URL via getSubgraphUrl helper
        const subgraphUrl = getSubgraphUrl(network, 'fund')
        
        if (!subgraphUrl) {
          console.error('❌ No subgraph URL for network:', network)
          return []
        }
      
      let query: string
      let orderBy: string
      
      switch (type) {
        case 'daily':
          query = INFO_SNAPSHOTS_QUERY
          orderBy = 'timestamp'
          break
        case 'weekly':
          query = INFO_WEEKLY_SNAPSHOTS_QUERY
          orderBy = 'timestamp'
          break
        case 'monthly':
          query = INFO_MONTHLY_SNAPSHOTS_QUERY
          orderBy = 'timestamp'
          break
        default:
          throw new Error(`Unsupported snapshot type: ${type}`)
      }
      
      const variables = {
        first,
        orderBy,
        orderDirection: 'desc' as const
      }
      
      const response = await request(subgraphUrl, query, variables, headers) as any
      
      // Check if response is valid
      if (!response) {
        console.warn('GraphQL response is null or undefined')
        return []
      }
      
      // Return the appropriate data based on type
      let data: InfoSnapshot[] = []
      switch (type) {
        case 'daily':
          data = response?.infoSnapshots || []
          break
        case 'weekly':
          data = response?.infoWeeklySnapshots || []
          break
        case 'monthly':
          data = response?.infoMonthlySnapshots || []
          break
      }
      
      return data
      } catch (error) {
        console.error('❌ Error fetching snapshots:', error)
        return []
      }
    },
    enabled: !!network,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Helper function to format snapshot data for charts
export function formatSnapshotDataForChart(snapshots: InfoSnapshot[]) {
  return snapshots
    .slice()
    .reverse() // Reverse to show chronological order (oldest to newest)
    .map((snapshot) => ({
      date: new Date(parseInt(snapshot.timestamp) * 1000).toISOString().split('T')[0],
      timestamp: parseInt(snapshot.timestamp),
      tvl: parseFloat(snapshot.totalAmountUSD),
      fundCount: parseInt(snapshot.fundCount),
      investorCount: parseInt(snapshot.investorCount),
    }))
}