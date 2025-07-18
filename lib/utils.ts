import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Detect actual wallet type from AppKit provider
export function detectActualWalletType(walletProvider: any): 'metamask' | 'phantom' | 'walletconnect' {
  if (!walletProvider) return 'walletconnect'
  
  const provider = walletProvider as any
  
  // Check Web3Modal connector peerMeta (most reliable method)
  if (provider?.connector?.peerMeta?.name) {
    const peerName = provider.connector.peerMeta.name.toLowerCase()
    if (peerName.includes('phantom')) {
      return 'phantom'
    }
    if (peerName.includes('metamask')) {
      return 'metamask'
    }
  }
  
  // Check alternative connector paths
  if (provider?.connector?.name) {
    const connectorName = provider.connector.name.toLowerCase()
    if (connectorName.includes('phantom')) {
      return 'phantom'
    }
    if (connectorName.includes('metamask')) {
      return 'metamask'
    }
  }
  
  // Check session metadata if available (prioritize this over provider properties)
  if (provider?.session?.peer?.metadata?.name) {
    const walletName = provider.session.peer.metadata.name.toLowerCase()
    if (walletName.includes('phantom')) {
      return 'phantom'
    }
    if (walletName.includes('metamask')) {
      return 'metamask'
    }
  }
  
  // **IMPORTANT**: Check for Phantom FIRST (before MetaMask)
  // Phantom sets isMetaMask=true for compatibility, so we need to check Phantom first
  
  // Most reliable Phantom detection: provider.isPhantom === true
  if (provider?.isPhantom === true) {
    return 'phantom'
  }
  
  // Secondary Phantom checks (only if isPhantom is not explicitly false)
  if (provider?.connection?.url?.includes('phantom') ||
      provider?.provider?.isPhantom) {
    return 'phantom'
  }
  
  // Check for MetaMask (only if isPhantom is not true)
  if (provider?.isPhantom !== true && 
      (provider?.isMetaMask || 
       provider?.connection?.url?.includes('metamask') || 
       provider?.provider?.isMetaMask ||
       provider?.selectedProvider?.isMetaMask)) {
    return 'metamask'
  }
  
  // Check provider connection name
  if (provider?.connection?.name) {
    const connectionName = provider.connection.name.toLowerCase()
    if (connectionName.includes('phantom')) {
      return 'phantom'
    }
    if (connectionName.includes('metamask')) {
      return 'metamask'
    }
  }
  
  // Check user agent for wallet browser detection (last resort)
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes('metamask')) {
      return 'metamask'
    }
  }
  
  // Fallback to WalletConnect
  return 'walletconnect'
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
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'uni',
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
        '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': 'uni',
        '0xd403d1624daef243fbcbd4a80d8a6f36affe32b2': 'link',
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'dai',
        '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196': 'aave',
        '0x9623063377AD1B27544C965cCd7342f7EA7e88C7': 'grt',
      }
    }
    
    const normalizedAddress = addressOrSymbol.toLowerCase()
    const networkMap = tokenAddressMap[network || 'ethereum']
    if (networkMap) {
      // Find matching address (case-insensitive)
      const logoName = Object.entries(networkMap).find(([addr, _]) => 
        addr.toLowerCase() === normalizedAddress
      )?.[1]
      if (logoName) {
        return `/tokens/small/${logoName}.png`
      }
    }
    
    // Search all networks if no network info or mapping not found
    for (const net of ['ethereum', 'arbitrum']) {
      const logoName = Object.entries(tokenAddressMap[net]).find(([addr, _]) => 
        addr.toLowerCase() === normalizedAddress
      )?.[1]
      if (logoName) {
        return `/tokens/small/${logoName}.png`
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
    return `/tokens/small/${symbolLogo}.png`
  }
  
  return null
}

// Get network logo path (optimized small version)
export function getNetworkLogo(network: 'ethereum' | 'arbitrum'): string {
  return `/networks/small/${network}.png`
}

// Get wallet logo path (optimized small version)
export function getWalletLogo(wallet: 'metamask' | 'phantom' | 'walletconnect'): string {
  return `/wallets/small/${wallet}.png`
}
