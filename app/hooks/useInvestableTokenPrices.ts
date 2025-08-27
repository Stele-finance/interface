'use client'

import { useMemo } from 'react'
import { useInvestableTokens } from './useInvestableTokens'
import { useUniswapBatchPrices, TokenInfo } from './useUniswapBatchPrices'

export function useInvestableTokenPrices(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  // Get investable tokens data
  const { data: tokensData, isLoading: isLoadingTokens, error: tokensError } = useInvestableTokens(network)
  
  // Convert investable tokens to TokenInfo format for price fetching
  const tokenInfos: TokenInfo[] = useMemo(() => {
    if (!tokensData?.investableTokens) return []
    
    return tokensData.investableTokens.map(token => ({
      symbol: token.symbol,
      address: token.tokenAddress,
      decimals: parseInt(token.decimals) || 18
    }))
  }, [tokensData])

  // Fetch prices using the batch price hook
  const { 
    data: priceData, 
    isLoading: isLoadingPrices, 
    error: priceError,
    refetch: refetchPrices
  } = useUniswapBatchPrices(tokenInfos, network)

  // Combine token info with price data
  const tokensWithPrices = useMemo(() => {
    if (!tokensData?.investableTokens || !priceData?.tokens) return []

    return tokensData.investableTokens.map(token => {
      const priceInfo = priceData.tokens[token.symbol]
      return {
        ...token,
        price: priceInfo?.priceUSD || null,
        priceLastUpdated: priceInfo?.lastUpdated || null
      }
    })
  }, [tokensData, priceData])

  return {
    data: tokensWithPrices,
    isLoading: isLoadingTokens || isLoadingPrices,
    error: tokensError || priceError,
    priceData,
    refetch: refetchPrices
  }
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