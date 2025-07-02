'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { SUBGRAPH_URL, headers } from '@/lib/constants'

export const getInvestorQuery = (investorId: string) => gql`{
  investor(id: "${investorId}") {
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
}`

export interface InvestorData {
  investor: {
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
}

export function useInvestorData(challengeId: string, walletAddress: string) {
  const investorId = `${challengeId}-${walletAddress.toUpperCase()}`
  return useQuery<InvestorData>({
    queryKey: ['investor', investorId],
    queryFn: async () => {
      return await request(SUBGRAPH_URL, getInvestorQuery(investorId), {}, headers)
    },
    refetchInterval: 10000, // Refetch every 10 seconds for better real-time experience
    staleTime: 5000, // Consider data fresh for 5 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // For new investors (404 errors), retry more aggressively
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return failureCount < 10; // Retry up to 10 times for 404 errors
      }
      return failureCount < 3; // Normal retry count for other errors
    },
    retryDelay: (attemptIndex) => {
      // For new investors, use shorter delay
      return Math.min(1000 * 2 ** attemptIndex, 30000); // Exponential backoff, max 30 seconds
    },
    enabled: !!walletAddress, // Only run query when wallet address is available
  })
}