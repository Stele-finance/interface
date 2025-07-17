'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { ARBITRUM_CHAIN_CONFIG, ETHEREUM_CHAIN_CONFIG } from '@/lib/constants'

// Wallet type definitions
export type WalletType = 'metamask' | 'phantom' | 'walletconnect'
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

// Get MetaMask provider
const getMetaMaskProvider = () => {
  if (typeof window === 'undefined') return null
  
  const ethereum = (window as any).ethereum
  if (!ethereum) return null
  
  // Check if multiple providers exist
  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    // Find specifically MetaMask provider
    return ethereum.providers.find((provider: any) => 
      provider.isMetaMask === true && 
      !provider.isPhantom &&
      !provider.phantom
    )
  }
  
  // If single provider and it's MetaMask (not Phantom)
  if (ethereum.isMetaMask === true && !ethereum.isPhantom && !ethereum.phantom) {
    return ethereum
  }
  
  return null
}

// Get Phantom provider
const getPhantomProvider = () => {
  if (typeof window === 'undefined') return null
  
  // First try to get from window.phantom.ethereum
  if ((window as any).phantom?.ethereum) {
    return (window as any).phantom.ethereum
  }
  
  // Fallback: check main ethereum object for Phantom
  const ethereum = (window as any).ethereum
  if (!ethereum) return null
  
  // Check if multiple providers exist
  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    return ethereum.providers.find((provider: any) => 
      provider.isPhantom === true || provider.phantom
    )
  }
  
  // If single provider and it's Phantom
  if (ethereum.isPhantom === true || ethereum.phantom) {
    return ethereum
  }
  
  return null
}

// Check wallet availability
const isWalletAvailable = (walletType: WalletType): boolean => {
  switch (walletType) {
    case 'metamask':
      return getMetaMaskProvider() !== null
    case 'phantom':
      return getPhantomProvider() !== null
          case 'walletconnect':
        return true // Handled by AppKit
      default:
        return false
    }
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
  
  // Restore state from localStorage
  const restoreFromStorage = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('walletConnection')
      if (stored) {
        const { walletType, address, network } = JSON.parse(stored)
        globalState = {
          ...globalState,
          walletType,
          address,
          network,
          isConnected: false // Connection status will be set after actual verification
        }
      }
    } catch (error) {
      console.warn('Failed to restore wallet state:', error)
      localStorage.removeItem('walletConnection')
    }
  }

export const useWallet = () => {
  const [localState, setLocalState] = useState<WalletState>(globalState)
  
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

  // Initialize
  useEffect(() => {
    restoreFromStorage()
    setLocalState(globalState)
    
    // Component initialization complete
    console.log('🚀 Wallet hook initialized')
  }, [])

  // Monitor WalletConnect state
  useEffect(() => {
    if (globalState.walletType === 'walletconnect' && appKitAccount && appKitNetwork) {
      const { address, isConnected } = appKitAccount
      const { chainId } = appKitNetwork
      
      if (isConnected && address) {
        const network = chainIdToNetwork(chainId || 1)
        updateState({
          address,
          isConnected: true,
          network
        })
        
        // WalletConnect connected - event handlers will now only respond to WalletConnect
        console.log('🔗 WalletConnect connected')
      } else if (globalState.isConnected) {
        // WalletConnect disconnected
        updateState({
          address: null,
          isConnected: false,
          walletType: null,
          network: null
        })
        
        // WalletConnect disconnected
        console.log('🔌 WalletConnect disconnected')
      }
    }
  }, [appKitAccount?.address, appKitAccount?.isConnected, appKitNetwork?.chainId])

  // Check and restore saved wallet connection state
  useEffect(() => {
    const checkConnection = async () => {
      if (!globalState.walletType || globalState.isConnected) return
      
      try {
        if (globalState.walletType === 'metamask') {
          const provider = getMetaMaskProvider()
          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' })
            if (accounts && accounts.length > 0) {
              const chainId = await provider.request({ method: 'eth_chainId' })
              updateState({
                address: accounts[0],
                isConnected: true,
                network: chainIdToNetwork(chainId)
              })
              
              // MetaMask connection restored - event handlers already set up
              console.log('🔄 MetaMask connection restored EXCLUSIVELY')
            }
          }
        } else if (globalState.walletType === 'phantom') {
          const provider = getPhantomProvider()
          if (provider && provider.isConnected) {
            const accounts = await provider.request({ method: 'eth_accounts' })
            if (accounts && accounts.length > 0) {
              const chainId = await provider.request({ method: 'eth_chainId' })
              updateState({
                address: accounts[0],
                isConnected: true,
                network: chainIdToNetwork(chainId)
              })
              
              // Phantom connection restored - event handlers already set up
              console.log('🔄 Phantom connection restored EXCLUSIVELY')
            }
          }
        }
      } catch (error) {
        console.warn('Failed to check wallet connection:', error)
        // Clear saved state if connection check fails
        updateState({
          address: null,
          isConnected: false,
          walletType: null,
          network: null
        })
      }
    }

    const timer = setTimeout(checkConnection, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Set up ALL wallet event listeners but only respond to connected wallet
  useEffect(() => {
    // MetaMask event listeners
    const metaMaskProvider = getMetaMaskProvider()
    if (metaMaskProvider) {
      const handleMetaMaskAccountsChanged = async (accounts: string[]) => {
        // ONLY respond if MetaMask is the connected wallet
        if (globalState.walletType !== 'metamask') {
          console.log('🚫 IGNORED MetaMask accountsChanged - Current wallet:', globalState.walletType)
          return
        }
        
        console.log('✅ MetaMask accounts changed:', accounts)
        
        if (accounts.length === 0) {
          updateState({
            address: null,
            isConnected: false,
            walletType: null,
            network: null
          })
        } else if (accounts[0] !== globalState.address) {
          try {
            const chainId = await metaMaskProvider.request({ method: 'eth_chainId' })
            updateState({
              address: accounts[0],
              network: chainIdToNetwork(chainId)
            })
          } catch (error) {
            console.error('Failed to get MetaMask chain ID:', error)
          }
        }
      }

      const handleMetaMaskChainChanged = (chainId: string) => {
        // ONLY respond if MetaMask is the connected wallet
        if (globalState.walletType !== 'metamask') {
          console.log('🚫 IGNORED MetaMask chainChanged - Current wallet:', globalState.walletType)
          return
        }
        
        console.log('✅ MetaMask chain changed:', chainId)
        updateState({
          network: chainIdToNetwork(chainId)
        })
      }

      if (metaMaskProvider.on) {
        metaMaskProvider.on('accountsChanged', handleMetaMaskAccountsChanged)
        metaMaskProvider.on('chainChanged', handleMetaMaskChainChanged)
      }
    }

    // Phantom event listeners
    const phantomProvider = getPhantomProvider()
    if (phantomProvider) {
      const handlePhantomAccountsChanged = async (accounts: string[]) => {
        // ONLY respond if Phantom is the connected wallet
        if (globalState.walletType !== 'phantom') {
          console.log('🚫 IGNORED Phantom accountsChanged - Current wallet:', globalState.walletType)
          return
        }
        
        console.log('✅ Phantom accounts changed:', accounts)
        
        if (accounts.length === 0) {
          updateState({
            address: null,
            isConnected: false,
            walletType: null,
            network: null
          })
        } else if (accounts[0] !== globalState.address) {
          try {
            const chainId = await phantomProvider.request({ method: 'eth_chainId' })
            updateState({
              address: accounts[0],
              network: chainIdToNetwork(chainId)
            })
          } catch (error) {
            console.error('Failed to get Phantom chain ID:', error)
          }
        }
      }

      const handlePhantomChainChanged = (chainId: string) => {
        // ONLY respond if Phantom is the connected wallet
        if (globalState.walletType !== 'phantom') {
          console.log('🚫 IGNORED Phantom chainChanged - Current wallet:', globalState.walletType)
          return
        }
        
        console.log('✅ Phantom chain changed:', chainId)
        updateState({
          network: chainIdToNetwork(chainId)
        })
      }

      if (phantomProvider.on) {
        phantomProvider.on('accountsChanged', handlePhantomAccountsChanged)
        phantomProvider.on('chainChanged', handlePhantomChainChanged)
      }
    }

    // Cleanup on unmount - but keep listeners active for real-time detection
    return () => {
      console.log('🧹 Component unmounting - keeping wallet event listeners for real-time detection')
    }
  }, []) // Only run once on mount

  // Connect wallet
  const connectWallet = useCallback(async (walletType: WalletType) => {
    // Mobile devices only support WalletConnect
    if (isMobile() && walletType !== 'walletconnect') {
      throw new Error('Mobile devices only support WalletConnect')
    }

    // Check wallet availability
    if (!isWalletAvailable(walletType)) {
      throw new Error(`${walletType} is not available`)
    }

    updateState({ isLoading: true })

    try {
      // Disconnect existing connection
      if (globalState.isConnected) {
        await disconnectWallet()
      }

      if (walletType === 'metamask') {
        const provider = getMetaMaskProvider()
        if (!provider) throw new Error('MetaMask not found')

        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        if (accounts && accounts.length > 0) {
          const chainId = await provider.request({ method: 'eth_chainId' })
          updateState({
            address: accounts[0],
            isConnected: true,
            walletType: 'metamask',
            network: chainIdToNetwork(chainId),
            isLoading: false
          })
          
          // MetaMask connected - event handlers will now only respond to MetaMask
          console.log('🔗 MetaMask connected EXCLUSIVELY')
        }
      } else if (walletType === 'phantom') {
        const provider = getPhantomProvider()
        if (!provider) throw new Error('Phantom not found')

        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        if (accounts && accounts.length > 0) {
          const chainId = await provider.request({ method: 'eth_chainId' })
          updateState({
            address: accounts[0],
            isConnected: true,
            walletType: 'phantom',
            network: chainIdToNetwork(chainId),
            isLoading: false
          })
          
          // Phantom connected - event handlers will now only respond to Phantom
          console.log('🔗 Phantom connected EXCLUSIVELY')
        }
      } else if (walletType === 'walletconnect') {
        if (appKit?.open) {
          updateState({
            walletType: 'walletconnect',
            isLoading: false
          })
          // WalletConnect opening - event handlers will only respond to WalletConnect
          console.log('🔗 WalletConnect opening')
          appKit.open()
        } else {
          throw new Error('WalletConnect not available')
        }
      }
    } catch (error) {
      updateState({ isLoading: false })
      throw error
    }
  }, [appKit])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (globalState.walletType === 'walletconnect') {
        // WalletConnect disconnection is handled by AppKit
        if (typeof window !== 'undefined' && (window as any).appKit) {
          await (window as any).appKit.disconnect()
        }
      }
      
      updateState({
        address: null,
        isConnected: false,
        walletType: null,
        network: null,
        isLoading: false
      })
      
      console.log('🔌 Wallet disconnected and ALL event listeners cleared')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (targetNetwork: NetworkType) => {
    if (!globalState.isConnected) {
      throw new Error('No wallet connected')
    }

    const chainConfig = targetNetwork === 'ethereum' ? ETHEREUM_CHAIN_CONFIG : ARBITRUM_CHAIN_CONFIG
    
    try {
      let provider = null
      
      if (globalState.walletType === 'metamask') {
        provider = getMetaMaskProvider()
      } else if (globalState.walletType === 'phantom') {
        provider = getPhantomProvider()
      } else if (globalState.walletType === 'walletconnect' && appKitProvider?.walletProvider) {
        provider = appKitProvider.walletProvider
      }

      if (!provider) {
        throw new Error('No provider available')
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
          let provider = null
          
          if (globalState.walletType === 'metamask') {
            provider = getMetaMaskProvider()
          } else if (globalState.walletType === 'phantom') {
            provider = getPhantomProvider()
          } else if (globalState.walletType === 'walletconnect' && appKitProvider?.walletProvider) {
            provider = appKitProvider.walletProvider
          }

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
    if (globalState.walletType === 'metamask') {
      const provider = getMetaMaskProvider()
      return provider ? new BrowserProvider(provider) : null
    } else if (globalState.walletType === 'phantom') {
      const provider = getPhantomProvider()
      return provider ? new BrowserProvider(provider) : null
    } else if (globalState.walletType === 'walletconnect' && appKitProvider?.walletProvider) {
      return new BrowserProvider(appKitProvider.walletProvider)
    }
    return null
  }, [appKitProvider])

  return {
    // State
    address: localState.address,
    isConnected: localState.isConnected,
    walletType: localState.walletType,
    network: localState.network,
    isLoading: localState.isLoading,
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getProvider,
    
    // Utilities
    isWalletAvailable,
    isMobile: isMobile(),
    openWalletModal: appKit?.open || null,
  }
} 