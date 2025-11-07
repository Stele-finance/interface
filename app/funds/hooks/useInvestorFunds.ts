import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'

// GraphQL query for Investor's funds
export const INVESTOR_FUNDS_QUERY = gql`
  query GetInvestorFunds($investor: Bytes!, $first: Int!) {
    investors(
      where: { investor: $investor, amountUSD_gt: "0" }
      first: $first
      orderBy: createdAtTimestamp
      orderDirection: desc
    ) {
      id
      fundId
      investor
      isManager
      share
      principal
      amountUSD
      profitUSD
      profitRatio
      createdAtTimestamp
      updatedAtTimestamp
    }
  }
`

// Get fund investorCount separately
export const FUND_INVESTOR_COUNT_QUERY = gql`
  query GetFundInvestorCount($fundId: String!) {
    fund(id: $fundId) {
      investorCount
    }
  }
`

export interface InvestorData {
  id: string
  fundId: string
  investor: string
  isManager: boolean
  share: string
  principal: string
  amountUSD: string
  profitUSD: string
  profitRatio: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  investorCount?: string // Will be fetched separately
}

export interface InvestorFundsData {
  investors: InvestorData[]
}

export function useInvestorFunds(investor: string, limit: number = 100, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network, 'fund')

  return useQuery<InvestorFundsData>({
    queryKey: ['investorFunds', investor, limit, network],
    queryFn: async () => {
      // Only fetch data for ethereum mainnet
      if (network !== 'ethereum') {
        return { investors: [] }
      }

      // Convert address to lowercase for subgraph query
      const lowercaseInvestor = investor.toLowerCase()

      // Fetch investor records
      const result = await request<{ investors: InvestorData[] }>(
        subgraphUrl,
        INVESTOR_FUNDS_QUERY,
        {
          investor: lowercaseInvestor,
          first: limit
        },
        getFundHeaders()
      )

      // Fetch investorCount for each fund
      const investorsWithCount = await Promise.all(
        result.investors.map(async (inv) => {
          try {
            const fundResult = await request<{ fund: { investorCount: string } | null }>(
              subgraphUrl,
              FUND_INVESTOR_COUNT_QUERY,
              { fundId: inv.fundId },
              getFundHeaders()
            )
            return {
              ...inv,
              investorCount: fundResult.fund?.investorCount || '0'
            }
          } catch (error) {
            console.error(`Failed to fetch investorCount for fund ${inv.fundId}:`, error)
            return {
              ...inv,
              investorCount: '0'
            }
          }
        })
      )

      return { investors: investorsWithCount }
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!investor, // Only run query if investor address is provided
  })
}
