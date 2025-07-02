'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'

export const getInvestableTokensQuery = () => gql`{
  investableTokens(first: 30, orderBy: id, orderDirection: asc, where: { isInvestable: true }, subgraphError: allow) {
    id
    tokenAddress
    decimals
    symbol
    isInvestable
    updatedTimestamp
  }
}`

export interface TokenData {
    id: string
    tokenAddress: string
    decimals: string
    symbol: string
  isInvestable: boolean
    updatedTimestamp: string
  }

export interface TokensData {
  investableTokens: TokenData[]
}

export function useTokensData(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<TokensData>({
    queryKey: ['tokens', network],
    queryFn: async () => {
      return await request(subgraphUrl, getInvestableTokensQuery(), {}, headers)
    }
  })
}