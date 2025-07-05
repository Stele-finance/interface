'use client'

import { useState, useEffect, useCallback } from 'react'
import { ARBITRUM_CHAIN_CONFIG, ETHEREUM_CHAIN_CONFIG } from '@/lib/constants'

interface WalletState {
  address: string | null
  isConnected: boolean
  network: 'solana' | 'ethereum' | 'arbitrum' | null
  walletType: 'metamask' | 'phantom' | null
}

// Global wallet state
let globalWalletState: WalletState = {
  address: null,
  isConnected: false,
  network: null,
  walletType: null
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
}

// Initialize state from localStorage
const initializeWalletState = () => {
  if (typeof window !== 'undefined') {
    const savedAddress = localStorage.getItem('walletAddress')
    const savedNetwork = localStorage.getItem('walletNetwork')
    const savedWalletType = localStorage.getItem('walletType')
    
    if (savedAddress) {
      updateGlobalState({
        address: savedAddress,
        isConnected: true,
        network: (savedNetwork as 'solana' | 'ethereum' | 'arbitrum') || 'ethereum',
        walletType: (savedWalletType as 'metamask' | 'phantom') || 'phantom'
      })
    }
  }
}

// Set up wallet event listeners
const setupWalletEventListeners = (walletType: 'metamask' | 'phantom') => {
  if (typeof window !== 'undefined') {
    const provider = walletType === 'metamask' ? (window as any).ethereum : window.phantom?.ethereum
    
    if (provider) {
      // Listen for account changes
      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('Accounts changed:', accounts)
        
        if (accounts.length === 0) {
          // User disconnected their wallet
          localStorage.removeItem('walletAddress')
          localStorage.removeItem('walletNetwork')
          localStorage.removeItem('walletType')
          updateGlobalState({
            address: null,
            isConnected: false,
            network: null,
            walletType: null
          })
        } else {
          // User switched to a different account
          const newAddress = accounts[0]
          
          // Get current chain to determine network
          try {
            const chainId = await provider.request({ 
              method: 'eth_chainId' 
            })
            
            let network: 'arbitrum' | 'ethereum' = 'ethereum'
            if (chainId === '0x1') {
              network = 'ethereum'
            } else if (chainId === '0xa4b1') {
              network = 'arbitrum'
            } else {
              network = 'ethereum' // Default to ethereum
            }
            
            // Update localStorage and global state
            localStorage.setItem('walletAddress', newAddress)
            localStorage.setItem('walletNetwork', network)
            
            updateGlobalState({
              address: newAddress,
              isConnected: true,
              network
            })
          } catch (error) {
            console.error('Error getting chain ID:', error)
            // Fallback: just update address
            localStorage.setItem('walletAddress', newAddress)
            updateGlobalState({
              address: newAddress,
              isConnected: true,
              network: globalWalletState.network || 'arbitrum'
            })
          }
        }
      }

      // Listen for chain changes
      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId)
        
        if (globalWalletState.isConnected) {
          let network: 'arbitrum' | 'ethereum' = 'ethereum'
          if (chainId === '0x1') {
            network = 'ethereum'
          } else if (chainId === '0xa4b1') {
            network = 'arbitrum'
          } else {
            network = 'ethereum' // Default to ethereum
          }
          
          // Update localStorage and global state
          localStorage.setItem('walletNetwork', network)
          updateGlobalState({
            network
          })
        }
      }

      // Add event listeners with type assertions
      if (provider.on) {
        provider.on('accountsChanged', handleAccountsChanged)
        provider.on('chainChanged', handleChainChanged)
      }

      // Return cleanup function
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }
  
  return () => {}
}

// Hook for using wallet state
export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(globalWalletState)

  // Function to get the correct provider for the active wallet
  const getActiveProvider = useCallback(() => {
    if (!globalWalletState.walletType) return null

    if (globalWalletState.walletType === 'metamask') {
      // For MetaMask, ensure we get the MetaMask provider specifically
      if ((window as any).ethereum) {
        if ((window as any).ethereum.providers) {
          const metaMaskProvider = (window as any).ethereum.providers.find((provider: any) => provider.isMetaMask)
          return metaMaskProvider || null
        }
        if ((window as any).ethereum.isMetaMask) {
          return (window as any).ethereum
        }
      }
      return null
    } else if (globalWalletState.walletType === 'phantom') {
      return window.phantom?.ethereum?.isPhantom ? window.phantom.ethereum : null
    }
    
    return null
  }, [])

  // Function to check and update current network state
  const checkAndUpdateNetworkState = useCallback(async () => {
    if (!globalWalletState.isConnected || !globalWalletState.walletType) return

    try {
      const provider = getActiveProvider()

      if (provider) {
        // For Ethereum-compatible networks only
        if (globalWalletState.network !== 'solana') {
          const currentChainId = await provider.request({ method: 'eth_chainId' })
          
          let detectedNetwork: 'ethereum' | 'arbitrum' = 'ethereum'
          if (currentChainId === '0x1') {
            detectedNetwork = 'ethereum'
          } else if (currentChainId === '0xa4b1') {
            detectedNetwork = 'arbitrum'
          } else {
            detectedNetwork = 'ethereum' // Default
          }

          // Only update if there's a genuine network change
          if (detectedNetwork !== globalWalletState.network) {
            console.log(`Network change detected on ${globalWalletState.walletType}: stored=${globalWalletState.network}, actual=${detectedNetwork}`)
            localStorage.setItem('walletNetwork', detectedNetwork)
            updateGlobalState({
              network: detectedNetwork
            })
          }
        }
        // For Solana, skip chain ID checks as it uses different methods
      }
    } catch (error) {
      console.warn('Failed to check network state:', error)
    }
  }, [getActiveProvider])

  useEffect(() => {
    // Initialize from localStorage on first load
    if (!globalWalletState.address) {
      initializeWalletState()
    }
    
    // Set initial state
    setWalletState(globalWalletState)
    
    // Subscribe to state changes
    const unsubscribe = subscribe(setWalletState)
    
    // Set up continuous monitoring for connected wallets
    if (globalWalletState.isConnected && globalWalletState.walletType) {
      // Initial check
      checkAndUpdateNetworkState()
      
             // Set up event listeners for the active wallet only
       const setupEventListeners = () => {
         const provider = getActiveProvider()
         const currentWalletType = globalWalletState.walletType
         
         if (!provider || !currentWalletType) return

         const handleChainChanged = (chainId: string) => {
           console.log(`Chain changed detected by ${currentWalletType}:`, chainId)
           
           // Only process if this is still the active wallet
           if (globalWalletState.isConnected && globalWalletState.walletType === currentWalletType) {
             let network: 'arbitrum' | 'ethereum' = 'ethereum'
             if (chainId === '0x1') {
               network = 'ethereum'
             } else if (chainId === '0xa4b1') {
               network = 'arbitrum'
             } else {
               network = 'ethereum'
             }
             
             localStorage.setItem('walletNetwork', network)
             updateGlobalState({ network })
           }
         }

         const handleAccountsChanged = (accounts: string[]) => {
           console.log(`Accounts changed detected by ${currentWalletType}:`, accounts)
           
           // Only process if this is still the active wallet
           if (globalWalletState.walletType === currentWalletType) {
             if (accounts.length === 0) {
               // Disconnect
               localStorage.removeItem('walletAddress')
               localStorage.removeItem('walletNetwork')
               localStorage.removeItem('walletType')
               updateGlobalState({
                 address: null,
                 isConnected: false,
                 network: null,
                 walletType: null
               })
             } else {
               // Account switched
               const newAddress = accounts[0]
               localStorage.setItem('walletAddress', newAddress)
               updateGlobalState({
                 address: newAddress
               })
             }
           }
         }

         if (provider.on) {
           provider.on('chainChanged', handleChainChanged)
           provider.on('accountsChanged', handleAccountsChanged)
         }

         // Return cleanup function
         return () => {
           if (provider.removeListener) {
             provider.removeListener('chainChanged', handleChainChanged)
             provider.removeListener('accountsChanged', handleAccountsChanged)
           }
         }
       }

             const cleanupEventListeners = setupEventListeners()

       // Reduced polling - only check every 30 seconds as backup
       const networkCheckInterval = setInterval(checkAndUpdateNetworkState, 30000)

       // Check on window focus
       const handleFocus = () => {
         checkAndUpdateNetworkState()
       }
       window.addEventListener('focus', handleFocus)

       return () => {
         unsubscribe()
         clearInterval(networkCheckInterval)
         window.removeEventListener('focus', handleFocus)
         if (cleanupEventListeners) {
           cleanupEventListeners()
         }
       }
    }
    
    return () => {
      unsubscribe()
    }
  }, [])

    // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletNetwork')
    localStorage.removeItem('walletType')
    
    // Update global state
    updateGlobalState({
      address: null,
      isConnected: false,
      network: null,
      walletType: null
    })
  }, [])

  // Get the correct provider based on wallet type
  const getProvider = useCallback((walletType: 'metamask' | 'phantom') => {
    if (walletType === 'metamask') {
      // For MetaMask, ensure we get the MetaMask provider specifically
      if ((window as any).ethereum) {
        // If there are multiple providers, find MetaMask specifically
        if ((window as any).ethereum.providers) {
          const metaMaskProvider = (window as any).ethereum.providers.find((provider: any) => provider.isMetaMask)
          return metaMaskProvider || null
        }
        // If single provider and it's MetaMask
        if ((window as any).ethereum.isMetaMask) {
          return (window as any).ethereum
        }
      }
      return null
    } else if (walletType === 'phantom') {
      // For Phantom, use only Phantom's Ethereum provider
      return window.phantom?.ethereum?.isPhantom ? window.phantom.ethereum : null
    }
    return null
  }, [])

  // Connect wallet function
  const connectWallet = useCallback(async (walletType: 'metamask' | 'phantom') => {
    try {
      // Clear any previous wallet connections
      disconnectWallet()
      
      const provider = getProvider(walletType)
      
      if (!provider) {
        if (walletType === 'metamask') {
          throw new Error('MetaMask is not installed or not active. Please install it from https://metamask.io/')
        } else {
          throw new Error('Phantom wallet is not installed or not active. Please install it from https://phantom.app/')
        }
      }

      if (walletType === 'metamask') {
        // MetaMask connection - verify we have the correct provider
        if (!provider || !provider.isMetaMask) {
          throw new Error('MetaMask provider not found. Please ensure MetaMask is installed and enabled.')
        }
        
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          
          // Get current chain ID
          const chainId = await provider.request({ 
            method: 'eth_chainId' 
          })
          
          let network: 'arbitrum' | 'ethereum' = 'ethereum'
          if (chainId === '0x1') { // Ethereum mainnet
            network = 'ethereum'
          } else if (chainId === '0xa4b1') { // Arbitrum mainnet
            network = 'arbitrum'
          } else {
            network = 'ethereum' // Default to ethereum
          }
          
          // Update localStorage
          localStorage.setItem('walletAddress', address)
          localStorage.setItem('walletNetwork', network)
          localStorage.setItem('walletType', 'metamask')
          
          // Update global state
          updateGlobalState({
            address,
            isConnected: true,
            network,
            walletType: 'metamask'
          })
          
          // Set up event listeners after successful connection
          setupWalletEventListeners('metamask')
          
          return { address, network }
        }
            } else if (walletType === 'phantom') {
        // Phantom connection - verify we have the correct provider
        if (provider && provider.isPhantom) {
          // Phantom connection - Try ETH first
          const accounts = await provider.request({ 
            method: 'eth_requestAccounts' 
          })
          
          if (accounts && accounts.length > 0) {
            const address = accounts[0]
            
            // Get current chain ID
            const chainId = await provider.request({ 
              method: 'eth_chainId' 
            })
            
            let network: 'ethereum' = 'ethereum'
            if (chainId === '0x1') { // Ethereum mainnet
              network = 'ethereum'
            } else {
              network = 'ethereum' // Default to ethereum for Phantom
            }
            
            // Update localStorage
            localStorage.setItem('walletAddress', address)
            localStorage.setItem('walletNetwork', network)
            localStorage.setItem('walletType', 'phantom')
            
            // Update global state
            updateGlobalState({
              address,
              isConnected: true,
              network,
              walletType: 'phantom'
            })
            
            // Set up event listeners after successful connection
            setupWalletEventListeners('phantom')
            
            return { address, network }
          }
        }
        
        // Fallback to Solana for Phantom
        const solanaProvider = window.phantom?.solana
        
        if (solanaProvider?.isPhantom) {
          const response = await solanaProvider.connect()
          const address = response.publicKey.toString()
          
          // Update localStorage
          localStorage.setItem('walletAddress', address)
          localStorage.setItem('walletNetwork', 'solana')
          localStorage.setItem('walletType', 'phantom')
          
          // Update global state
          updateGlobalState({
            address,
            isConnected: true,
            network: 'solana',
            walletType: 'phantom'
          })
          
          return { address, network: 'solana' }
        }
      }
      
      throw new Error('Failed to connect to wallet')
    } catch (error) {
      console.error('Wallet connection error:', error)
      throw error
    }
  }, [getProvider, disconnectWallet])

  // Switch network function
  const switchNetwork = useCallback(async (targetNetwork: 'solana' | 'ethereum' | 'arbitrum') => {
    const currentWalletType = globalWalletState.walletType
    if (!currentWalletType) {
      throw new Error('No wallet connected')
    }

    // Check if trying to switch to Arbitrum with Phantom wallet
    if (targetNetwork === 'arbitrum' && currentWalletType === 'phantom') {
      throw new Error('Phantom wallet does not support Arbitrum network. Please use MetaMask.')
    }

    try {
      const provider = getProvider(currentWalletType)
      
      if (!provider) {
        throw new Error(`${currentWalletType} wallet not found or not active`)
      }

      let targetChainId: string
      let chainConfig: any

      if (targetNetwork === 'arbitrum') {
        if (currentWalletType !== 'metamask') {
          throw new Error('Only MetaMask supports Arbitrum network')
        }
        targetChainId = '0xa4b1'
        chainConfig = ARBITRUM_CHAIN_CONFIG
        
      } else if (targetNetwork === 'ethereum') {
        targetChainId = '0x1'
        chainConfig = ETHEREUM_CHAIN_CONFIG
      } else {
        throw new Error(`Unsupported network: ${targetNetwork}`)
      }

      // Get current chain ID
      let currentChainId: string
      try {
        currentChainId = await provider.request({ method: 'eth_chainId' })
      } catch (error) {
        console.warn('Could not get current chain ID:', error)
        currentChainId = '0x0' // fallback
      }

      // If already on the target network, just update state
      if (currentChainId === targetChainId) {
        localStorage.setItem('walletNetwork', targetNetwork)
        updateGlobalState({
          network: targetNetwork
        })
        return
      }

      // Try to switch to the target chain
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        })
        
        // Successfully switched - update state
        localStorage.setItem('walletNetwork', targetNetwork)
        updateGlobalState({
          network: targetNetwork
        })
        
      } catch (switchError: any) {
        console.log('Switch error code:', switchError.code)
        
        // If the chain doesn't exist in the wallet (error code 4902)
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            // Add the chain first
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig],
            })
            
            // After adding, try to switch again
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
            })
            
            // Successfully added and switched - update state
            localStorage.setItem('walletNetwork', targetNetwork)
            updateGlobalState({
              network: targetNetwork
            })
            
          } catch (addError: any) {
            console.error('Error adding chain:', addError)
            throw new Error(`Failed to add ${targetNetwork} network to wallet. Please add it manually.`)
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          throw new Error('Network switch cancelled by user')
        } else {
          // Other errors
          console.error('Network switch error:', switchError)
          throw new Error(`Failed to switch to ${targetNetwork} network. Please try switching manually in your wallet.`)
        }
      }
    } catch (error) {
      console.error('Network switch error:', error)
      throw error
    }
  }, [getProvider])

  return {
    address: walletState.address,
    isConnected: walletState.isConnected,
    network: walletState.network,
    walletType: walletState.walletType,
    connectWallet,
    disconnectWallet,
    switchNetwork
  }
} 