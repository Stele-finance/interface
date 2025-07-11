'use client'

import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

const INVESTABLE_TOKENS_QUERY = gql`{
  investableTokens(first: 50, orderBy: symbol, orderDirection: asc, where: { isInvestable: true }, subgraphError: allow) {
    id
    tokenAddress
    decimals
    symbol
    isInvestable
    updatedTimestamp
  }
}`

export interface InvestableToken {
  id: string
  tokenAddress: string
  decimals: string
  symbol: string
  isInvestable: boolean
  updatedTimestamp: string
}

export interface InvestableTokensData {
  investableTokens: InvestableToken[]
}

export interface InvestableTokenInfo {
  address: string
  symbol: string
  decimals: number
  isInvestable: boolean
}

export function useInvestableTokens(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<InvestableTokensData>({
    queryKey: ['investable-tokens', network],
    queryFn: async () => {
      return await request(subgraphUrl, INVESTABLE_TOKENS_QUERY, {}, headers)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get formatted token info for swap components
export function useInvestableTokensForSwap(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const { data, isLoading, error } = useInvestableTokens(network)
  
  const tokenOptions: InvestableTokenInfo[] = data?.investableTokens?.map(token => ({
    address: token.tokenAddress,
    symbol: token.symbol,
    decimals: parseInt(token.decimals),
    isInvestable: token.isInvestable
  })) || []

  return {
    tokens: tokenOptions,
    isLoading,
    error
  }
}

// Helper function to get token address by symbol
export function getTokenAddressBySymbol(tokens: InvestableTokenInfo[], symbol: string): string {
  const token = tokens.find(t => t.symbol === symbol)
  return token?.address || ''
}

// Helper function to get token decimals by symbol
export function getTokenDecimalsBySymbol(tokens: InvestableTokenInfo[], symbol: string): number {
  const token = tokens.find(t => t.symbol === symbol)
  return token?.decimals || 18
} 