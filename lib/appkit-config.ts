'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { WALLETCONNECT_PROJECT_ID } from './constants'

// 1. Set the networks
const networks = [
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://cloudflare-eth.com'] }
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' }
    }
  },
  {
    id: 42161,
    name: 'Arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] }
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://arbiscan.io' }
    }
  }
]

// 2. Create a metadata object
const metadata = {
  name: 'Stele Finance',
  description: 'Stele Finance DeFi Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stele.io',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/stele_logo.png` : 'https://stele.io/stele_logo.png']
}

// 3. Create the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 4. Create the AppKit instance - Initialize immediately
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

createAppKit({
  adapters: [ethersAdapter],
  networks: networks as any,
  projectId: WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd3', // Use environment variable with fallback
  metadata,
  features: {
    analytics: false, // Disable analytics for localhost
    email: false, // Disable email feature
    socials: [], // Disable social login
    allWallets: false, // Disable "All Wallets" option
  },
  
  // Wallet configuration - only show specific wallets
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393'  // Phantom
  ],
  
    themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': 1000,
    '--w3m-accent': '#3b82f6'
  },
  // Additional options for localhost
  ...(isLocalhost && {
    enableAnalytics: false,
    allowUnsupportedChain: true,
  })
}) 