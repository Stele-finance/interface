'use client'

import { useQuery } from '@tanstack/react-query'
import { useFundData } from './useFundData'

export interface UserTokenInfo {
  address: string
  symbol: string
  amount: string
  decimals: string
}

export function useFundUserTokens(fundId: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Get fund data (reuse existing hook for better caching)
  const { data: fundDataResponse, isLoading: isLoadingFund } = useFundData(fundId, network)

  // Process and cache the token data
  return useQuery<UserTokenInfo[]>({
    queryKey: ['fundUserTokens', fundId, network],
    queryFn: () => {
      if (!fundDataResponse?.fund) {
        return []
      }

      const fund = fundDataResponse.fund
      const tokens = fund.tokens || []
      const tokensAmount = fund.tokensAmount || []
      const tokensSymbols = fund.tokensSymbols || []
      const tokensDecimals = fund.tokensDecimals || []

      // Create token info array from Fund's current holdings
      const userTokens: UserTokenInfo[] = tokens.map((address, index) => {
        const rawAmount = tokensAmount[index] || '0'
        const decimals = tokensDecimals[index] || '18'
        const symbol = tokensSymbols[index] || `TOKEN_${index}`
        
        // Fund schema uses BigDecimal which should already be in human-readable format
        // Use the amount directly as it comes from the subgraph
        const formattedAmount = rawAmount
        
        return {
          address,
          symbol,
          amount: formattedAmount,
          decimals: decimals
        }
      })

      return userTokens
    },
    enabled: !!fundDataResponse?.fund && !isLoadingFund,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
}