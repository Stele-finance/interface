import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'

// GraphQL query for Manager's funds
export const MANAGER_FUNDS_QUERY = gql`
  query GetManagerFunds($manager: Bytes!, $first: Int!) {
    funds(
      where: { manager: $manager }
      first: $first
      orderBy: createdAtTimestamp
      orderDirection: desc
    ) {
      id
      fundId
      manager
      share
      amountUSD
      profitUSD
      profitRatio
      investorCount
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
      createdAtTimestamp
      updatedAtTimestamp
    }
  }
`

export interface ManagerFund {
  id: string
  fundId: string
  manager: string
  share: string
  amountUSD: string
  profitUSD: string
  profitRatio: string
  investorCount: string
  tokens: string[]
  tokensSymbols: string[]
  tokensDecimals: string[]
  tokensAmount: string[]
  createdAtTimestamp: string
  updatedAtTimestamp: string
}

export interface ManagerFundsData {
  funds: ManagerFund[]
}

export function useManagerFunds(manager: string, limit: number = 100, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network, 'fund')

  return useQuery<ManagerFundsData>({
    queryKey: ['managerFunds', manager, limit, network],
    queryFn: async () => {
      // Only fetch data for ethereum mainnet
      if (network !== 'ethereum') {
        return { funds: [] }
      }

      // Convert address to lowercase for subgraph query
      const lowercaseManager = manager.toLowerCase()
      const result = await request<ManagerFundsData>(
        subgraphUrl,
        MANAGER_FUNDS_QUERY,
        {
          manager: lowercaseManager,
          first: limit
        },
        getFundHeaders()
      )
      return result
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!manager, // Only run query if manager address is provided
  })
}
