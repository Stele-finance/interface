'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'

const GET_FUND_INVESTORS_QUERY = `
  query GetFundInvestors($fundId: String!) {
    investors(
      where: {
        fundId: $fundId
      }
      orderBy: amountUSD
      orderDirection: desc
      first: 100
    ) {
      id
      createdAtTimestamp
      updatedAtTimestamp
      fundId
      investor
      isManager
      share
      principal
      amountUSD
      profitUSD
      profitRatio
    }
  }
`

export interface FundInvestor {
  id: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  fundId: string
  investor: string
  isManager: boolean
  share: string | null
  principal: string
  amountUSD: string
  profitUSD: string
  profitRatio: string
}

export interface FundInvestorsResponse {
  investors: FundInvestor[]
}

export function useFundInvestors(fundId: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Use Fund-specific subgraph URL
  const fundNetwork = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
  const subgraphUrl = NETWORK_SUBGRAPHS[fundNetwork]
  
  return useQuery({
    queryKey: ['fundInvestors', fundId, network],
    queryFn: async () => {      
      try {
        const data = await request<FundInvestorsResponse>(subgraphUrl, GET_FUND_INVESTORS_QUERY, {
          fundId: fundId
        }, getFundHeaders())

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        return data.investors || []
      } catch (error) {
        console.error('❌ Error fetching fund investors:', error)
 
        // If there's a network error, try to provide more context
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        
        // Return empty array instead of throwing to prevent UI crashes
        return []
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!fundId, // Only run if fundId is provided
  })
}