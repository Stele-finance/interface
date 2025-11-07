import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'

// GraphQL query for Investor's funds
export const INVESTOR_FUNDS_QUERY = gql`
  query GetInvestorFunds($investor: Bytes!, $first: Int!) {
    investors(
      where: { investor: $investor }
      first: $first
      orderBy: createdAtTimestamp
      orderDirection: desc
    ) {
      id
      investor
      fund {
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
      amountUSD
      principal
      profitUSD
      share
      createdAtTimestamp
      updatedAtTimestamp
    }
  }
`

export interface InvestorFundData {
  id: string
  investor: string
  fund: {
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
  amountUSD: string
  principal: string
  profitUSD: string
  share: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
}

export interface InvestorFundsData {
  investors: InvestorFundData[]
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
      const result = await request<InvestorFundsData>(
        subgraphUrl,
        INVESTOR_FUNDS_QUERY,
        {
          investor: lowercaseInvestor,
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
    enabled: !!investor, // Only run query if investor address is provided
  })
}
