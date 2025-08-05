import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

// GraphQL query for Investor portfolio
export const INVESTOR_PORTFOLIO_QUERY = gql`
  query GetInvestorPortfolio($investor: Bytes!, $first: Int!, $orderBy: Investor_orderBy!, $orderDirection: OrderDirection!) {
    investors(
      where: { investor: $investor }
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      challengeId
      createdAtTimestamp
      updatedAtTimestamp
      investor
      seedMoneyUSD
      currentUSD
      tokens
      tokensAmount
      tokensDecimals
      tokensSymbols
      profitUSD
      profitRatio
      isRegistered
    }
  }
`

export interface InvestorPortfolio {
  id: string
  challengeId: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  investor: string
  seedMoneyUSD: string
  currentUSD: string
  tokens: string[]
  tokensAmount: string[]
  tokensDecimals: string[]
  tokensSymbols: string[]
  profitUSD: string
  profitRatio: string
  isRegistered: boolean
}

export interface InvestorPortfolioData {
  investors: InvestorPortfolio[]
}

export function useInvestorPortfolio(investor: string, limit: number = 100, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<InvestorPortfolioData>({
    queryKey: ['investorPortfolio', investor, limit, network],
    queryFn: async () => {
      return await request(
        subgraphUrl, 
        INVESTOR_PORTFOLIO_QUERY, 
        {
          investor,
          first: limit,
          orderBy: 'updatedAtTimestamp',
          orderDirection: 'desc'
        }, 
        headers
      )
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!investor, // Only run query if investor address is provided
  })
} 