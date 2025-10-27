'use client'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders, getBlockTimeSeconds } from '@/lib/constants'
import { getAllFundNFTsQuery, FundNFTData, ManagerNFT } from '../queries/fundNFTQueries'
import { ethers } from 'ethers'

export function useFundNFTData(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network, 'fund')
  const headers = getFundHeaders()

  return useQuery<FundNFTData>({
    queryKey: ['fundNfts', network],
    queryFn: async () => {
      return await request(subgraphUrl, getAllFundNFTsQuery(), {}, headers)
    },
    refetchInterval: 30000,
    staleTime: 10000,
    gcTime: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useFormattedFundNFTData(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const { data, isLoading, error, refetch } = useFundNFTData(network)

  const formattedNFTs = data?.managerNFTs?.map((nft: ManagerNFT) => {
    // Convert returnRate: if data is 138, it should be displayed as 1.38%
    // So divide by 100
    const returnRatePercentage = parseFloat(nft.returnRate) / 100

    // Format mintedAt timestamp to readable date
    const mintedDate = new Date(parseInt(nft.mintedAt) * 1000)

    // fundCreated is a block number, not a timestamp
    // We need to estimate the date based on the block number
    // This is an approximation - for exact dates, we'd need the actual block timestamp
    const fundCreatedBlock = parseInt(nft.fundCreated)
    const mintedAtBlock = parseInt(nft.mintedAt)

    // Calculate fundCreated date by assuming mintedAt is close to current time
    // and working backwards based on block difference
    const blockTimeSeconds = getBlockTimeSeconds(network || 'ethereum')
    const blockDifference = mintedAtBlock - fundCreatedBlock
    const timeDifferenceMs = blockDifference * blockTimeSeconds * 1000
    const fundCreatedDate = new Date(mintedDate.getTime() - timeDifferenceMs)

    return {
      ...nft,
      returnRateFormatted: returnRatePercentage.toFixed(2),
      dateFormatted: mintedDate.toLocaleDateString(),
      timestampFormatted: mintedDate.toLocaleString(),
      fundCreatedFormatted: fundCreatedDate.toLocaleDateString(),
      mintedAtFormatted: mintedDate.toLocaleDateString()
    }
  }) || []

  return {
    nfts: formattedNFTs,
    isLoading,
    error: error?.message || null,
    refetch
  }
}
