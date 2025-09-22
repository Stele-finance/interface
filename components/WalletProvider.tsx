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

    const metadata = {
      name: 'Stele Finance',
      description: 'Stele Finance DeFi Platform',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://stele.finance',
      icons: [typeof window !== 'undefined' ? `${window.location.origin}/stele_logo.png` : 'https://stele.finance/stele_logo.png']
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
          allWallets: false,
        },
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393'  // Phantom
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