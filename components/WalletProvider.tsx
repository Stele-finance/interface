'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { WALLETCONNECT_PROJECT_ID } from '@/lib/constants'

let appKitInstance: any = null

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Skip if already initialized
    if (appKitInstance) {
      setIsInitialized(true)
      return
    }

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
      }
    ]

    const metadata = {
      name: 'Stele Finance',
      description: 'Stele Finance DeFi Platform',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://stele.finance',
      icons: [typeof window !== 'undefined' ? `${window.location.origin}/stele_logo.png` : 'https://stele.finance/stele_logo.png'],
      redirect: {
        native: typeof window !== 'undefined' ? window.location.origin : 'https://stele.finance',
        universal: typeof window !== 'undefined' ? window.location.origin : 'https://stele.finance',
      }
    }

    const ethersAdapter = new EthersAdapter()

    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

    try {
      appKitInstance = createAppKit({
        adapters: [ethersAdapter],
        networks: networks as any,
        projectId: WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd3',
        metadata,
        features: {
          analytics: false,
          email: false,
          socials: [],
          allWallets: true,
          swaps: false,
          onramp: false,
        },
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
        ],
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
        ],
        excludeWalletIds: [
          '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
          '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26', // Rainbow
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Brave Wallet
          '163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3', // Brave (another ID)
          '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Web3 Wallet
        ],
        themeMode: 'dark',
        themeVariables: {
          '--w3m-z-index': 1000,
          '--w3m-accent': '#3b82f6'
        },
        ...(isLocalhost && {
          enableAnalytics: false,
          allowUnsupportedChain: true,
        })
      })
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize AppKit:', error)
    }
  }, [])

  // Don't render children until AppKit is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Initializing wallet...</div>
      </div>
    )
  }

  return <>{children}</>
}