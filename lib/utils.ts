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
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'usdt',
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wbtc',
        '0x1f9840a85d5af5bf1d1762f925bdadc4201f984': 'uni',
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'link',
        '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai',
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave',
        '0xc944E90C64B2c07662A292be6244BDf05Cda44a7': 'grt',
      },
      arbitrum: {
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usdc',
        '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'weth',
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'usdt',
        '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'wbtc',
        '0xfb3cb973b2a9e2e09746393c59e7fb0d5189d290': 'uni',
        '0xd403d1624daef243fbcbd4a80d8a6f36affe32b2': 'link',
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'dai',
        '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196': 'aave',
        '0x9623063377AD1B27544C965cCd7342f7EA7e88C7': 'grt',
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
    'UNI': 'uni',
    'DAI': 'dai',
    'LINK': 'link',
    'AAVE': 'aave',
    'GRT': 'grt',
  }
  
  const symbolLogo = symbolMap[addressOrSymbol.toUpperCase()]
  if (symbolLogo) {
    return `/tokens/${symbolLogo}.png`
  }
  
  return null
}
