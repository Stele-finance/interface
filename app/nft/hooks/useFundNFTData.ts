'use client'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, getFundHeaders } from '@/lib/constants'
import { getAllFundNFTsQuery, getUserFundNFTsQuery, FundNFTData, ManagerNFT } from '../queries/fundNFTQueries'

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
    const returnRatePercentage = parseFloat(nft.returnRate) / 100

    return {
      ...nft,
      returnRateFormatted: returnRatePercentage.toFixed(2),
      fundCreatedFormatted: nft.fundCreated,
      mintedAtFormatted: nft.mintedAt
    }
  }) || []

  return {
    nfts: formattedNFTs,
    isLoading,
    error: error?.message || null,
    refetch
  }
}

export function useUserFundNFTData(
  network: 'ethereum' | 'arbitrum' | null = 'ethereum',
  userAddress: string | null
) {
  const subgraphUrl = getSubgraphUrl(network, 'fund')
  const headers = getFundHeaders()

  return useQuery<FundNFTData>({
    queryKey: ['userFundNfts', network, userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return { managerNFTs: [] }
      }
      return await request(subgraphUrl, getUserFundNFTsQuery(userAddress), {}, headers)
    },
    enabled: !!userAddress,
    refetchInterval: 30000,
    staleTime: 10000,
    gcTime: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useFormattedUserFundNFTData(
  network: 'ethereum' | 'arbitrum' | null = 'ethereum',
  userAddress: string | null
) {
  const { data, isLoading, error, refetch } = useUserFundNFTData(network, userAddress)

  const formattedNFTs = data?.managerNFTs?.map((nft: ManagerNFT) => {
    const returnRatePercentage = parseFloat(nft.returnRate) / 100

    return {
      ...nft,
      returnRateFormatted: returnRatePercentage.toFixed(2),
      fundCreatedFormatted: nft.fundCreated,
      mintedAtFormatted: nft.mintedAt
    }
  }) || []

  return {
    nfts: formattedNFTs,
    isLoading,
    error: error?.message || null,
    refetch
  }
}
