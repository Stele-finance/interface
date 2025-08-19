'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { NETWORK_SUBGRAPHS } from '@/lib/constants'

const FUND_INVESTOR_QUERY = gql`
  query GetFundInvestor($investorId: String!) {
    investor(id: $investorId) {
      id
      createdAtTimestamp
      updatedAtTimestamp
      fundId
      investor
      isManager
      principalETH
      principalUSD
      currentETH
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
      profitETH
      profitUSD
      profitRatio
    }
  }
`

const headers = { 
  Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY 
}

export interface FundInvestor {
  id: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  fundId: string
  investor: string
  isManager: boolean
  principalETH: string
  principalUSD: string
  currentETH: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
  profitETH: string
  profitUSD: string
  profitRatio: string
}

export interface FundInvestorResponse {
  investor: FundInvestor | null
}

export function useFundInvestorData(fundId: string, walletAddress: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Create investor ID: fundId-investor format
  const investorId = `${fundId}-${walletAddress.toLowerCase()}`
  const url = network === 'ethereum' ? NETWORK_SUBGRAPHS.ethereum_fund : NETWORK_SUBGRAPHS.arbitrum_fund
  
  return useQuery<FundInvestorResponse>({
    queryKey: ['fundInvestor', investorId, network],
    queryFn: async (): Promise<FundInvestorResponse> => {
      try {
        const result = await request<FundInvestorResponse>(url, FUND_INVESTOR_QUERY, { 
          investorId 
        }, headers)
        
        return result
      } catch (error) {
        console.error('Error fetching fund investor data:', error)
        // Return null investor if not found (user hasn't joined)
        return { investor: null }
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    enabled: !!walletAddress && !!fundId, // Only run when both are available
  })
}