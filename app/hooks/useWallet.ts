'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { ARBITRUM_CHAIN_CONFIG, ETHEREUM_CHAIN_CONFIG } from '@/lib/constants'

interface WalletState {
  address: string | null
  isConnected: boolean
  network: 'solana' | 'ethereum' | 'arbitrum' | null
  walletType: 'metamask' | 'phantom' | 'walletconnect' | null
  connectedWallet: 'metamask' | 'phantom' | null // For WalletConnect, which actual wallet is connected
}

// Global wallet state
let globalWalletState: WalletState = {
  address: null,
  isConnected: false,
  network: null,
  walletType: null,
  connectedWallet: null
}

// Subscribers for state updates
let subscribers: Array<(state: WalletState) => void> = []

// Subscribe to wallet state changes
const subscribe = (callback: (state: WalletState) => void) => {
  subscribers.push(callback)
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback)
  }
}

// Update global state and notify subscribers
const updateGlobalState = (newState: Partial<WalletState>) => {
  globalWalletState = { ...globalWalletState, ...newState }
  subscribers.forEach(callback => callback(globalWalletState))
  
  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('walletState', JSON.stringify({
      walletType: globalWalletState.walletType,
      connectedWallet: globalWalletState.connectedWallet
    }))
  }
}

// Initialize state from localStorage
const initializeFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('walletState')
      if (stored) {
        const { walletType, connectedWallet } = JSON.parse(stored)
        globalWalletState.walletType = walletType
        globalWalletState.connectedWallet = connectedWallet
      }
    } catch (error) {
      console.error('Failed to parse stored wallet state:', error)
    }
  }
}

// Detect wallet from provider
const detectWalletFromProvider = (provider: any): 'metamask' | 'phantom' | null => {
  if (!provider) return null
  
  // Check for MetaMask
  if (provider.isMetaMask) return 'metamask'
  
  // Check for Phantom
  if (provider.isPhantom) return 'phantom'
  
  // Check user agent or other methods
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('metamask')) return 'metamask'
  if (userAgent.includes('phantom')) return 'phantom'
  
  return null
}

// Main useWallet hook
export const useWallet = () => {
  // Local loading state for this hook instance
  const [isLoading, setIsLoading] = useState(false)
  const [localState, setLocalState] = useState(globalWalletState)
  
  // Safely handle AppKit hooks with individual try-catch
  let appKitOpen: (() => void) | null = null
  let appKitDisconnect: (() => Promise<void>) | null = null
  let appKitAddress: string | undefined = undefined
  let appKitIsConnected: boolean = false
  let appKitChainId: number | undefined = undefined
  let appKitWalletProvider: any = undefined

  try {
    const { open } = useAppKit()
    appKitOpen = open
  } catch (error) {
    // console.warn('useAppKit not available:', error)
  }

  try {
    const { address, isConnected } = useAppKitAccount()
    appKitAddress = address
    appKitIsConnected = isConnected
  } catch (error) {
    // console.warn('useAppKitAccount not available:', error)
  }

  try {
    const { chainId } = useAppKitNetwork()
    appKitChainId = typeof chainId === 'number' ? chainId : undefined
  } catch (error) {
    // console.warn('useAppKitNetwork not available:', error)
  }

  try {
    const { walletProvider } = useAppKitProvider('eip155')
    appKitWalletProvider = walletProvider
  } catch (error) {
    // console.warn('useAppKitProvider not available:', error)
  }

  // Subscribe to global state changes
  useEffect(() => {
    const unsubscribe = subscribe(setLocalState)
    return unsubscribe
  }, [])

  // Initialize from storage on mount
  useEffect(() => {
    initializeFromStorage()
  }, [])

  // Update global state when AppKit state changes
  useEffect(() => {
    let network: 'ethereum' | 'arbitrum' | null = null
    
    if (appKitChainId === 1) {
      network = 'ethereum'
    } else if (appKitChainId === 42161) {
      network = 'arbitrum'
    }

    // Detect connected wallet if using WalletConnect
    let detectedWallet = globalWalletState.connectedWallet
    if (appKitWalletProvider && !detectedWallet) {
      detectedWallet = detectWalletFromProvider(appKitWalletProvider)
    }

    const walletType = appKitIsConnected ? 'walletconnect' : null
    
    // Update global state immediately when AppKit state changes
    updateGlobalState({
      address: appKitAddress,
      isConnected: appKitIsConnected,
      network,
      walletType,
      connectedWallet: detectedWallet
    })
  }, [appKitAddress, appKitIsConnected, appKitChainId, appKitWalletProvider])



  // Connect wallet function
  const connectWallet = useCallback(async (selectedWalletType: 'metamask' | 'phantom' | 'walletconnect') => {
    if (selectedWalletType === 'walletconnect') {
      try {
        if (appKitOpen) {
          appKitOpen()
          return { success: true }
        } else {
          throw new Error('AppKit not initialized')
        }
      } catch (error) {
        console.error('Failed to open AppKit modal:', error)
        throw error
      }
    } else if (selectedWalletType === 'metamask') {
      // Direct MetaMask connection
      if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
        try {
          setIsLoading(true)
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
          if (accounts && accounts.length > 0) {
            updateGlobalState({
              address: accounts[0],
              isConnected: true,
              walletType: 'metamask',
              connectedWallet: 'metamask',
              network: 'ethereum'
            })
            return { address: accounts[0], network: 'ethereum' }
          }
        } catch (error) {
          console.error('MetaMask connection failed:', error)
          throw error
        } finally {
          setIsLoading(false)
        }
      } else {
        throw new Error('MetaMask is not installed')
      }
    } else if (selectedWalletType === 'phantom') {
      // Direct Phantom connection
      if (typeof window !== 'undefined' && (window as any).phantom?.ethereum) {
        try {
          setIsLoading(true)
          const phantomProvider = (window as any).phantom.ethereum
          const accounts = await phantomProvider.request({ method: 'eth_requestAccounts' })
          if (accounts && accounts.length > 0) {
            updateGlobalState({
              address: accounts[0],
              isConnected: true,
              walletType: 'phantom',
              connectedWallet: 'phantom',
              network: 'ethereum'
            })
            return { address: accounts[0], network: 'ethereum' }
          }
        } catch (error) {
          console.error('Phantom connection failed:', error)
          throw error
        } finally {
          setIsLoading(false)
        }
      } else {
        throw new Error('Phantom is not installed')
      }
    }
  }, [appKitOpen])

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      // For WalletConnect, trigger AppKit disconnect if connected
      if (globalWalletState.walletType === 'walletconnect' && appKitIsConnected) {
        try {
          // Try to disconnect from AppKit
          if (typeof window !== 'undefined' && (window as any).appKit) {
            await (window as any).appKit.disconnect()
          }
        } catch (appKitError) {
          console.warn('Failed to disconnect from AppKit:', appKitError)
        }
      }
      
      // Clear global state
      updateGlobalState({
        address: null,
        isConnected: false,
        network: null,
        walletType: null,
        connectedWallet: null
      })
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletState')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }, [appKitIsConnected])

  // Switch network function
  const switchNetwork = useCallback(async (targetNetwork: 'ethereum' | 'arbitrum') => {
    if (!appKitWalletProvider) {
      throw new Error('No wallet connected')
    }

    try {
      const chainConfig = targetNetwork === 'ethereum' ? ETHEREUM_CHAIN_CONFIG : ARBITRUM_CHAIN_CONFIG
      
      // Try to switch to the target network
      await (appKitWalletProvider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      })
      
      updateGlobalState({ network: targetNetwork })
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          const chainConfig = targetNetwork === 'ethereum' ? ETHEREUM_CHAIN_CONFIG : ARBITRUM_CHAIN_CONFIG
          await (appKitWalletProvider as any).request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          })
          updateGlobalState({ network: targetNetwork })
        } catch (addError) {
          console.error('Failed to add network:', addError)
          throw addError
        }
      } else {
        console.error('Failed to switch network:', switchError)
        throw switchError
      }
    }
  }, [appKitWalletProvider])

  // Get provider function
  const getProvider = useCallback(() => {
    if (appKitWalletProvider) {
      return new BrowserProvider(appKitWalletProvider as any)
    }
    return null
  }, [appKitWalletProvider])

  return {
    // State from local state (subscribed to global)
    address: localState.address,
    isConnected: localState.isConnected,
    network: localState.network,
    walletType: localState.walletType,
    connectedWallet: localState.connectedWallet,
    isLoading,
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getProvider,
    openWalletModal: appKitOpen, // Add AppKit modal open function
    
    // Subscribe to state changes
    subscribe
  }
} 