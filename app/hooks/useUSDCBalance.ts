import { useQuery } from '@tanstack/react-query'
import { getUSDCTokenAddress } from '@/lib/constants'
import { ethers } from 'ethers'

const USDC_DECIMALS = 6

// Get chain ID based on network
const getChainId = (network: 'ethereum' | 'arbitrum' | null): number => {
  if (network === 'arbitrum') {
    return 42161 // Arbitrum One
  }
  return 1 // Ethereum Mainnet
}

// Use unified Etherscan v2 API endpoint
const API_URL = 'https://api.etherscan.io/v2/api'

export function useUSDCBalance(
  address: string | null,
  network: 'ethereum' | 'arbitrum' | null = 'ethereum'
) {
  return useQuery({
    queryKey: ['usdcBalance', address, network],
    queryFn: async () => {
      if (!address) {
        throw new Error('No address provided')
      }

      const chainId = getChainId(network)
      const usdcTokenAddress = getUSDCTokenAddress(network)
      const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY

      if (!apiKey) {
        throw new Error('API key not configured')
      }

      const url = new URL(API_URL)
      url.searchParams.append('chainid', chainId.toString())
      url.searchParams.append('module', 'account')
      url.searchParams.append('action', 'tokenbalance')
      url.searchParams.append('contractaddress', usdcTokenAddress)
      url.searchParams.append('address', address)
      url.searchParams.append('tag', 'latest')
      url.searchParams.append('apikey', apiKey)

      try {
        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()

        if (data.status !== '1') {
          // Handle specific API errors
          if (data.message === 'NOTOK') {
            if (data.result?.includes('Invalid API Key')) {
              throw new Error('Invalid Etherscan API key')
            } else if (data.result?.includes('Max rate limit reached')) {
              throw new Error('API rate limit exceeded. Please try again later.')
            } else {
              throw new Error(`API Error: ${data.result || 'Unknown error'}`)
            }
          }
          throw new Error(data.message || `API returned status: ${data.status}`)
        }

        // Convert from wei to USDC (6 decimals)
        const balanceInWei = data.result
        const balanceInUSDC = ethers.formatUnits(balanceInWei, USDC_DECIMALS)
        
        return {
          balance: balanceInUSDC,
          balanceRaw: balanceInWei,
          formatted: `${parseFloat(balanceInUSDC).toFixed(2)} USDC`
        }
        
      } catch (error) {
        // If it's a network or API error, provide a fallback response
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to API')
        }
        
        throw error
      }
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if API key is missing
      if (error?.message?.includes('API key')) {
        return false
      }
      // Only retry network errors up to 2 times
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
} 