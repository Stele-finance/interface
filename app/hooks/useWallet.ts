'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { ARBITRUM_CHAIN_CONFIG, ETHEREUM_CHAIN_CONFIG } from '@/lib/constants'

// Wallet type definitions - WalletConnect only
export type WalletType = 'walletconnect'
export type NetworkType = 'ethereum' | 'arbitrum'

// Wallet state interface
interface WalletState {
  address: string | null
  isConnected: boolean
  walletType: WalletType | null
  network: NetworkType | null
  isLoading: boolean
}

// Initial state
const initialState: WalletState = {
  address: null,
  isConnected: false,
  walletType: null,
  network: null,
  isLoading: false
}

// Global state management
let globalState: WalletState = { ...initialState }
let subscribers: Array<(state: WalletState) => void> = []

// Subscriber management
const subscribe = (callback: (state: WalletState) => void) => {
  subscribers.push(callback)
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback)
  }
}

// State update function
const updateState = (newState: Partial<WalletState>) => {
  globalState = { ...globalState, ...newState }
  subscribers.forEach(callback => callback(globalState))
  
  // Save state to localStorage
  if (typeof window !== 'undefined') {
    if (globalState.isConnected && globalState.walletType && globalState.address) {
      localStorage.setItem('walletConnection', JSON.stringify({
        walletType: globalState.walletType,
        address: globalState.address,
        network: globalState.network
      }))
    } else {
      localStorage.removeItem('walletConnection')
    }
  }
}

// Device type detection
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

// Convert network ID to network type
const chainIdToNetwork = (chainId: string | number): NetworkType => {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId
  switch (id) {
    case 1:
      return 'ethereum'
    case 42161:
      return 'arbitrum'
    default:
      return 'ethereum'
  }
}

// Restore state from localStorage - only restore if AppKit actually shows as connected
const restoreFromStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem('walletConnection')
    if (stored) {
      const { walletType, address, network } = JSON.parse(stored)
      
      // Only restore WalletConnect but DON'T automatically set as connected
      // Let AppKit's actual connection state determine if we're connected
      if (walletType === 'walletconnect') {
        globalState = {
          ...globalState,
          walletType,
          address,
          network,
          isConnected: false // Don't automatically set as connected - let AppKit determine this
        }
      }
    }
  } catch (error) {
    console.warn('Failed to restore wallet state:', error)
    localStorage.removeItem('walletConnection')
  }
}

export const useWallet = () => {
  const [localState, setLocalState] = useState<WalletState>(globalState)
  const [isAppKitReady, setIsAppKitReady] = useState(false)
  
  // AppKit hooks
  let appKit: any = null
  let appKitAccount: any = null
  let appKitNetwork: any = null
  let appKitProvider: any = null

  try {
    appKit = useAppKit()
  } catch (e) {
    // AppKit not available
  }

  try {
    appKitAccount = useAppKitAccount()
  } catch (e) {
    // AppKitAccount not available
  }

  try {
    appKitNetwork = useAppKitNetwork()
  } catch (e) {
    // AppKitNetwork not available
  }

  try {
    appKitProvider = useAppKitProvider('eip155')
  } catch (e) {
    // AppKitProvider not available
  }

  // Subscribe to state
  useEffect(() => {
    const unsubscribe = subscribe(setLocalState)
    return unsubscribe
  }, [])

  // Check if AppKit is ready
  useEffect(() => {
    if (appKit && appKitAccount && appKitNetwork && appKitProvider) {
      setIsAppKitReady(true)
    } else {
      setIsAppKitReady(false)
    }
  }, [appKit, appKitAccount, appKitNetwork, appKitProvider])

  // Initialize - DON'T auto-restore from storage to prevent automatic wallet prompts
  useEffect(() => {
    if (isAppKitReady) {
      // Only set local state, don't auto-restore from storage
      setLocalState(globalState)
    }
  }, [isAppKitReady])

  // Monitor WalletConnect state
  useEffect(() => {
    if (appKitAccount && appKitNetwork) {
      const { address, isConnected } = appKitAccount
      const { chainId } = appKitNetwork
      
      if (isConnected && address) {
        const network = chainIdToNetwork(chainId || 1)
        updateState({
          address,
          isConnected: true,
          walletType: 'walletconnect',
          network
        })
        
        // Force localStorage update
        if (typeof window !== 'undefined') {
          localStorage.setItem('walletConnection', JSON.stringify({
            walletType: 'walletconnect',
            address: address,
            network: network
          }))
        }
      } else if (globalState.walletType === 'walletconnect' && globalState.isConnected) {
        // WalletConnect disconnected
        updateState({
          address: null,
          isConnected: false,
          walletType: null,
          network: null
        })
      }
    }
  }, [appKitAccount?.address, appKitAccount?.isConnected, appKitNetwork?.chainId])

  // Connect wallet - WalletConnect only
  const connectWallet = useCallback(async () => {
    if (!appKit?.open) {
      throw new Error('WalletConnect not available')
    }

    updateState({ isLoading: true })

    try {
      // Disconnect existing connection if any
      if (globalState.isConnected) {
        await disconnectWallet()
      }

      updateState({
        walletType: 'walletconnect',
        isLoading: false
      })
      
      appKit.open()
    } catch (error) {
      updateState({ isLoading: false })
      throw error
    }
  }, [appKit])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (globalState.walletType === 'walletconnect' && appKit?.disconnect) {
        await appKit.disconnect()
      }
      
      updateState({
        address: null,
        isConnected: false,
        walletType: null,
        network: null,
        isLoading: false
      })      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }, [appKit])

  // Switch network
  const switchNetwork = useCallback(async (targetNetwork: NetworkType) => {
    if (!globalState.isConnected || globalState.walletType !== 'walletconnect') {
      throw new Error('WalletConnect not connected')
    }

    const chainConfig = targetNetwork === 'ethereum' ? ETHEREUM_CHAIN_CONFIG : ARBITRUM_CHAIN_CONFIG
      
    try {
      const provider = appKitProvider?.walletProvider
      if (!provider) {
        throw new Error('WalletConnect provider not available')
      }

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      })
      
      updateState({ network: targetNetwork })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Add network if it doesn't exist
        try {
          const provider = appKitProvider?.walletProvider
          if (provider) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig],
            })
            updateState({ network: targetNetwork })
          }
        } catch (addError) {
          throw addError
        }
      } else {
        throw switchError
      }
    }
  }, [appKitProvider])

  // Get provider
  const getProvider = useCallback(() => {
    if (globalState.walletType === 'walletconnect' && appKitProvider?.walletProvider) {
      return new BrowserProvider(appKitProvider.walletProvider)
    }
    return null
  }, [appKitProvider])

  return {
    // State - only show as connected if AppKit is ready and actually connected
    address: isAppKitReady ? localState.address : null,
    isConnected: isAppKitReady && localState.isConnected,
    walletType: isAppKitReady ? localState.walletType : null,
    network: isAppKitReady ? localState.network : null,
    isLoading: localState.isLoading || !isAppKitReady,
    
    // Functions
    connectWallet, // No parameters needed - WalletConnect only
    disconnectWallet,
    switchNetwork,
    getProvider,
    
    // Utilities
    isWalletAvailable: true, // WalletConnect is always available
    isMobile: isMobile(),
    openWalletModal: appKit?.open || null,
    isAppKitReady, // Export this for debugging
  }
} 