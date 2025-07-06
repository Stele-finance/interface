import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get token logo path based on address or symbol
export function getTokenLogo(addressOrSymbol: string, network?: 'ethereum' | 'arbitrum'): string | null {
  // Input validation
  if (!addressOrSymbol || typeof addressOrSymbol !== 'string') {
    return null
  }
  
  // Check if it's an address format (starts with 0x and at least 40 characters)
  if (addressOrSymbol.startsWith('0x') && addressOrSymbol.length >= 40) {
    // Token address mapping by network
    const tokenAddressMap: Record<string, Record<string, string>> = {
      ethereum: {
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usdc',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'weth',
        '0x0000000000000000000000000000000000000000': 'eth', // ETH native
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'usdt',
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wbtc',
      },
      arbitrum: {
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usdc', // Arbitrum USDC
        '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'weth', // Arbitrum WETH
        '0x0000000000000000000000000000000000000000': 'eth', // ETH native
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'usdt', // Arbitrum USDT
        '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'wbtc', // Arbitrum WBTC
      }
    }
    
    const networkMap = tokenAddressMap[network || 'ethereum']
    if (networkMap) {
      const logoName = networkMap[addressOrSymbol.toLowerCase()]
      if (logoName) {
        return `/tokens/${logoName}.png`
      }
    }
    
    // Search all networks if no network info or mapping not found
    for (const net of ['ethereum', 'arbitrum']) {
      const logoName = tokenAddressMap[net][addressOrSymbol.toLowerCase()]
      if (logoName) {
        return `/tokens/${logoName}.png`
      }
    }
    
    return null
  }
  
  // If it's a symbol, check symbol mapping
  const symbolMap: Record<string, string> = {
    'ETH': 'eth',
    'WETH': 'weth',
    'USDC': 'usdc',
    'USDT': 'usdt',
    'WBTC': 'wbtc',
  }
  
  const symbolLogo = symbolMap[addressOrSymbol.toUpperCase()]
  if (symbolLogo) {
    return `/tokens/${symbolLogo}.png`
  }
  
  return null
}
