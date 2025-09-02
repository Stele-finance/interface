import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

// GraphQL queries for different snapshot types - orderBy as direct parameter
const INFO_SNAPSHOTS_QUERY = gql`
  query InfoSnapshots($first: Int!, $orderDirection: OrderDirection!) {
    infoSnapshots(first: $first, orderBy: timestamp, orderDirection: $orderDirection) {
      id
      timestamp
      fundCount
      investorCount
      totalAmountUSD
    }
  }
`

const INFO_WEEKLY_SNAPSHOTS_QUERY = gql`
  query InfoWeeklySnapshots($first: Int!, $orderDirection: OrderDirection!) {
    infoWeeklySnapshots(first: $first, orderBy: timestamp, orderDirection: $orderDirection) {
      id
      timestamp
      fundCount
      investorCount
      totalAmountUSD
    }
  }
`

const INFO_MONTHLY_SNAPSHOTS_QUERY = gql`
  query InfoMonthlySnapshots($first: Int!, $orderDirection: OrderDirection!) {
    infoMonthlySnapshots(first: $first, orderBy: timestamp, orderDirection: $orderDirection) {
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
        // Use Fund subgraph URL for info snapshots (InfoSnapshot is in Fund subgraph)
        const subgraphUrl = getSubgraphUrl(network, 'fund')
        
        if (!subgraphUrl) {
          console.error('❌ No subgraph URL for network:', network)
          return []
        }
      
      let query: string
      
      switch (type) {
        case 'daily':
          query = INFO_SNAPSHOTS_QUERY
          break
        case 'weekly':
          query = INFO_WEEKLY_SNAPSHOTS_QUERY
          break
        case 'monthly':
          query = INFO_MONTHLY_SNAPSHOTS_QUERY
          break
        default:
          throw new Error(`Unsupported snapshot type: ${type}`)
      }
      
      const variables = {
        first,
        orderDirection: 'desc' as const
      }
      
      // Studio subgraphs might not need API key
      const response = await request(
        subgraphUrl, 
        query, 
        variables, 
        headers.Authorization ? headers : undefined
      ) as any
      
      // Check if response is valid
      if (!response) {
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