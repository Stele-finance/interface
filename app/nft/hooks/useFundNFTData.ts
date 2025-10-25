'use client'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'
import { getAllFundNFTsQuery, FundNFTData, ManagerNFT } from '../queries/fundNFTQueries'

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
    // Convert returnRate from raw BigInt string to percentage
    const returnRatePercentage = parseFloat(nft.returnRate) / 1e18 * 100

    // Format timestamp to readable date
    const date = new Date(parseInt(nft.mintedAt) * 1000)

    return {
      ...nft,
      returnRateFormatted: returnRatePercentage.toFixed(2),
      dateFormatted: date.toLocaleDateString(),
      timestampFormatted: date.toLocaleString(),
      // Generate NFT image path for fund
      imagePath: `/nft/fund/1st.png`
    }
  }) || []

  return {
    nfts: formattedNFTs,
    isLoading,
    error: error?.message || null,
    refetch
  }
}
