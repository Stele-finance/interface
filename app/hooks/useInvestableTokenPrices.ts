'use client'

import { useMemo } from 'react'
import { useChallengeInvestableTokens } from './useChallengeInvestableTokens'
import { useUniswapBatchPrices } from './useUniswapBatchPrices'

// Challenge-specific investable token prices hook
export function useChallengeInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  // Get challenge investable tokens data
  const { data: tokensData, isLoading: isLoadingTokens, error: tokensError } = useChallengeInvestableTokens(network)

  // Prepare token infos for direct price fetching (network-specific)
  const tokenInfos = useMemo(() => {
    if (!tokensData?.investableTokens || tokensData.investableTokens.length === 0) return []

    return tokensData.investableTokens.map(token => ({
      address: token.tokenAddress,
      symbol: token.symbol,
      decimals: Number(token.decimals)
    }))
  }, [tokensData])

  // Fetch prices directly for this specific network (not using global context)
  const {
    data: priceData,
    isLoading: isLoadingPrices,
    error: priceError,
    refetch: refetchPrices
  } = useUniswapBatchPrices(tokenInfos, network)

  // Combine challenge token info with price data
  const challengeTokensWithPrices = useMemo(() => {
    if (!tokensData?.investableTokens) return []

    return tokensData.investableTokens.map(token => {
      // Get price from network-specific price data
      const priceInfo = priceData?.tokens?.[token.symbol]
      return {
        ...token,
        price: priceInfo?.priceUSD || null,
        priceLastUpdated: priceInfo?.lastUpdated || null
      }
    })
  }, [tokensData, priceData])

  // Helper function to get token price by symbol (for challenge context)
  const getChallengeTokenPriceBySymbol = (symbol: string) => {
    const token = challengeTokensWithPrices.find(t => t.symbol === symbol)
    return token?.price || null
  }

  // Helper function to get token price by address (for challenge context)
  const getChallengeTokenPriceByAddress = (address: string) => {
    const token = challengeTokensWithPrices.find(t => t.tokenAddress.toLowerCase() === address.toLowerCase())
    return token?.price || null
  }

  return {
    data: challengeTokensWithPrices,
    tokens: challengeTokensWithPrices, // alias for convenience
    isLoading: isLoadingTokens || isLoadingPrices,
    error: tokensError || priceError,
    refetch: refetchPrices,
    getChallengeTokenPriceBySymbol,
    getChallengeTokenPriceByAddress
  }
}

// Backward compatibility - keep the old function name but use challenge-specific implementation
export function useInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  return useChallengeInvestableTokenPrices(network)
}

export interface InvestableTokenWithPrice {
  id: string
  tokenAddress: string
  decimals: string
  symbol: string
  isInvestable: boolean
  updatedTimestamp: string
  price: number | null
  priceLastUpdated: Date | null
}