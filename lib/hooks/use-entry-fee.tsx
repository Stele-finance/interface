"use client"

import { 
  createContext, 
  useContext, 
  ReactNode 
} from "react"
import { useQuery } from '@tanstack/react-query'
import { ethers } from "ethers"
import { 
  USDC_DECIMALS,
  getSteleContractAddress,
  getRPCUrl
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useWallet } from "@/app/hooks/useWallet"

type EntryFeeContextType = {
  entryFee: string | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

const EntryFeeContext = createContext<EntryFeeContextType | undefined>(undefined)

function useEntryFeeQuery() {
  const { network } = useWallet()
  
  // Use current connected network, fallback to ethereum
  const targetNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  console.log('🔍 useEntryFee - Current network:', network, '→ Target network:', targetNetwork)
  
  return useQuery<string>({
    queryKey: ['entryFee', targetNetwork],
    queryFn: async () => {
      console.log('📡 Fetching entry fee for network:', targetNetwork)
      
      // Add delay to prevent overwhelming RPC
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      
      const rpcUrl = getRPCUrl(targetNetwork)
      console.log('🌐 Using RPC URL:', rpcUrl)
      
      // Create a read-only provider
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      
      // Create contract instance for the specific network
      const contractAddress = getSteleContractAddress(targetNetwork)
      console.log('📋 Using contract address:', contractAddress, 'for network:', targetNetwork)
      
      const steleContract = new ethers.Contract(
        contractAddress,
        SteleABI.abi,
        provider
      )
      
      // Call entryFee view function
      const fee = await steleContract.entryFee()
      console.log('💰 Raw entry fee from contract:', fee.toString(), 'for network:', targetNetwork)
      
      // The contract returns a value that needs to be divided by 100 to get the actual USDC amount
      // For example: contract returns 1000 (raw) -> should be 0.01 USDC
      const adjustedFee = fee
      const formattedFee = ethers.formatUnits(adjustedFee, USDC_DECIMALS);
      console.log('💱 Formatted entry fee:', formattedFee, 'USDC for network:', targetNetwork)
      
      // Convert to integer (remove decimal places)
      const integerFee = Math.floor(parseFloat(formattedFee)).toString();
      console.log('✅ Final entry fee:', integerFee, 'USDC for network:', targetNetwork)

      return integerFee
    },
    enabled: !!network, // Only run query when network is available
    staleTime: 5 * 60 * 1000, // Reduce stale time to 5 minutes for faster updates
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    retry: 2, // Increase retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Faster retry
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  })
}

export function EntryFeeProvider({ children }: { children: ReactNode }) {
  const { data: entryFee, isLoading, error, refetch } = useEntryFeeQuery()

  return (
    <EntryFeeContext.Provider
      value={{
        entryFee: entryFee || null,
        isLoading,
        error: error instanceof Error ? error : null,
        refresh: refetch
      }}
    >
      {children}
    </EntryFeeContext.Provider>
  )
}

export function useEntryFee() {
  const context = useContext(EntryFeeContext)
  
  if (context === undefined) {
    throw new Error("useEntryFee must be used within an EntryFeeProvider")
  }
  
  return context
} 