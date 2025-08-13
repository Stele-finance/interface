'use client'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, headers } from '@/lib/constants'
import { getAllNFTsQuery, NFTData, PerformanceNFT } from '../queries/nftQueries'

export function useNFTData(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery<NFTData>({
    queryKey: ['allNfts', network],
    queryFn: async () => {
      return await request(subgraphUrl, getAllNFTsQuery(), {}, headers)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => ({
      performanceNFTs: data?.performanceNFTs || []
    })
  })
}

export function useFormattedNFTData(network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const { data, isLoading, error, refetch } = useNFTData(network)
  
  const formattedNFTs = data?.performanceNFTs.map((nft: PerformanceNFT) => {
    // Convert returnRate from raw BigInt string to percentage
    const returnRatePercentage = parseFloat(nft.returnRate) / 1e18 * 100
    
    // Format timestamp to readable date
    const date = new Date(parseInt(nft.blockTimestamp) * 1000)
    
    return {
      ...nft,
      returnRateFormatted: returnRatePercentage.toFixed(2),
      dateFormatted: date.toLocaleDateString(),
      timestampFormatted: date.toLocaleString(),
      rankSuffix: getRankSuffix(nft.rank),
      // Generate NFT image path based on rank
      imagePath: `/nft/challenge/${getRankImageName(nft.rank)}.png`
    }
  }) || []

  return {
    nfts: formattedNFTs,
    isLoading,
    error: error?.message || null,
    refetch
  }
}

function getRankSuffix(rank: number): string {
  const lastDigit = rank % 10
  const lastTwoDigits = rank % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th'
  }
  
  switch (lastDigit) {
    case 1: return 'st'
    case 2: return 'nd' 
    case 3: return 'rd'
    default: return 'th'
  }
}

function getRankImageName(rank: number): string {
  switch (rank) {
    case 1: return '1st'
    case 2: return '2nd'
    case 3: return '3rd'
    case 4: return '4th'
    case 5: return '5th'
    default: return '5th' // Default fallback image
  }
}