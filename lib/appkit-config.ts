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

  // Disable automatic wallet detection to prevent Brave Wallet from showing
  // enableEIP6963: false,
  // enableInjected: false,
  // Show only MetaMask, Phantom, WalletConnect - use only included wallets
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393'  // Phantom
  ],

  // Featured wallets (shown at top) - WalletConnect is always shown by default
  // featuredWalletIds: [
  //   'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  //   'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393'  // Phantom
  // ],
  // // Exclude unwanted wallets but keep WalletConnect, MetaMask, Phantom
  // excludeWalletIds: [
  //   'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Brave Wallet
  //   '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150', // Browser Wallet  
  //   '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Browser Wallet (alternative)
  //   // Remove other wallets to keep modal clean
  //   '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
  //   '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  //   '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget Wallet
  //   '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  //   'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576', // Exodus
  //   '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger Live
  //   'ecc4036f814562b41a5268adc86270ffc7fd91225a490621fdf7a0c863c7d7e4', // ArgentX
  //   '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
  // ],
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