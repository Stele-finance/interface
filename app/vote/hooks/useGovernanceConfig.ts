import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { getGovernanceContractAddress } from '@/lib/constants'
import { getManagedProvider } from '@/lib/provider-manager'
import GovernorABI from '@/app/abis/SteleGovernor.json'

interface GovernanceConfig {
  votingPeriod: number // in blocks
  votingDelay: number // in blocks
  proposalThreshold: string // in wei
  quorumNumerator: number
  quorumDenominator: number
}

export const useGovernanceConfig = (network: 'ethereum' | 'arbitrum' = 'ethereum', enabled: boolean = true) => {
  const { data: config, isLoading, error, refetch } = useQuery<GovernanceConfig>({
    queryKey: ['governanceConfig', network],
    enabled: enabled, // Allow disabling the query
    queryFn: async () => {
      // Add small fixed delay to prevent overwhelming RPC
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use managed provider to prevent multiple connections
      const defaultNetwork = network
      const provider = getManagedProvider(defaultNetwork)
      const governanceContract = new ethers.Contract(getGovernanceContractAddress(defaultNetwork), GovernorABI.abi, provider)

      // Fetch all governance parameters in parallel
      const [
        votingPeriod,
        votingDelay,
        proposalThreshold,
        quorumNumerator,
        quorumDenominator
      ] = await Promise.all([
        governanceContract.votingPeriod(),
        governanceContract.votingDelay(),
        governanceContract.proposalThreshold(),
        governanceContract.quorumNumerator(),
        governanceContract.quorumDenominator()
      ])

      const governanceConfig: GovernanceConfig = {
        votingPeriod: Number(votingPeriod),
        votingDelay: Number(votingDelay),
        proposalThreshold: proposalThreshold.toString(),
        quorumNumerator: Number(quorumNumerator),
        quorumDenominator: Number(quorumDenominator)
      }

      return governanceConfig
    },
    staleTime: 24 * 60 * 60 * 1000, // Governance config rarely changes - keep fresh for 24 hours
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Reduce retry attempts
    retryDelay: (attemptIndex) => Math.min(5000 * 2 ** attemptIndex, 30000), // Longer delay between retries
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: false, // Only refetch if data is stale
    refetchOnReconnect: false, // Disable refetch on reconnect
  })

  return {
    config,
    isLoading,
    error: error?.message || null,
    refetch
  }
} 