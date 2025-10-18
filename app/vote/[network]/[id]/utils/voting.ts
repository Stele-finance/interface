import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { VoteOption, NetworkType, BlockchainActionResult } from "../components/types"
import { getGovernanceContractAddress, getSteleTokenAddress } from "@/lib/constants"
import GovernorABI from "@/app/abis/SteleGovernor.json"
import ERC20VotesABI from "@/app/abis/ERC20Votes.json"

// Handle voting on a proposal
export const handleVote = async (
  proposalId: string,
  voteOption: VoteOption,
  reason: string,
  walletAddress: string | null,
  walletType: string | null,
  walletConnected: boolean,
  votingPower: string,
  network: NetworkType,
  getProvider: () => any,
  t: (key: any) => string
): Promise<BlockchainActionResult> => {
  try {
    // Validation checks
    if (!voteOption) {
      return { success: false, error: "No vote option selected" }
    }

    if (!walletConnected) {
      return { success: false, error: "Wallet not connected" }
    }

    if (Number(votingPower) === 0) {
      return { success: false, error: "No voting power" }
    }

    // Get provider - same approach as Fund Create
    const browserProvider = await getProvider()
    if (!browserProvider) {
      throw new Error("No provider available. Please connect your wallet first.")
    }

    // Always switch to the selected network before making the transaction
    const targetChainId = network === 'arbitrum' ? 42161 : 1;

    // Try to switch to the selected network
    try {
      await browserProvider.send('wallet_switchEthereumChain', [
        { chainId: `0x${targetChainId.toString(16)}` }
      ]);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added to wallet, add it
        const networkConfig = network === 'arbitrum' ? {
          chainId: '0xa4b1',
          chainName: 'Arbitrum One',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://arb1.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://arbiscan.io/']
        } : {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io/']
        };

        await browserProvider.send('wallet_addEthereumChain', [networkConfig]);
      } else if (switchError.code === 4001) {
        // User rejected the network switch
        const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
        throw new Error(`Please switch to ${networkName} network to vote.`);
      } else {
        throw switchError;
      }
    }

    // Get a fresh provider after network switch to ensure we're on the correct network
    const updatedProvider = await getProvider();
    if (!updatedProvider) {
      throw new Error('Failed to get provider after network switch');
    }

    const signer = await updatedProvider.getSigner()
    const contract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, signer)

    // Convert vote option to support value
    // 0 = Against, 1 = For, 2 = Abstain
    let support: number
    switch (voteOption) {
      case 'for':
        support = 1
        break
      case 'against':
        support = 0
        break
      case 'abstain':
        support = 2
        break
      default:
        throw new Error("Invalid vote option")
    }

    let tx
    if (reason.trim()) {
      // Cast vote with reason
      tx = await contract.castVoteWithReason(proposalId, support, reason.trim())
    } else {
      // Cast vote without reason
      tx = await contract.castVote(proposalId, support)
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    return { success: true, transactionHash: receipt.hash }

  } catch (error: any) {
    console.error("Voting error:", error)
    return { success: false, error: error.message || "Voting failed" }
  }
}

// Handle delegation to self
export const handleDelegate = async (
  walletAddress: string | null,
  walletType: string | null,
  walletConnected: boolean,
  network: NetworkType,
  getProvider: () => any,
  t: (key: any) => string
): Promise<BlockchainActionResult> => {
  try {
    if (!walletConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate",
      })
      return { success: false, error: "Wallet not connected" }
    }

    if (!walletAddress) {
      throw new Error("No wallet address available")
    }

    // Get provider - same approach as Fund Create
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.")
    }

    // Always switch to the selected network before making the transaction
    const targetChainId = network === 'arbitrum' ? 42161 : 1;

    // Try to switch to the selected network
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${targetChainId.toString(16)}` }
      ]);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added to wallet, add it
        const networkConfig = network === 'arbitrum' ? {
          chainId: '0xa4b1',
          chainName: 'Arbitrum One',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://arb1.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://arbiscan.io/']
        } : {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io/']
        };

        await provider.send('wallet_addEthereumChain', [networkConfig]);
      } else if (switchError.code === 4001) {
        // User rejected the network switch
        const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
        throw new Error(`Please switch to ${networkName} network to delegate.`);
      } else {
        throw switchError;
      }
    }

    // Get a fresh provider after network switch to ensure we're on the correct network
    const updatedProvider = await getProvider();
    if (!updatedProvider) {
      throw new Error('Failed to get provider after network switch');
    }

    const signer = await updatedProvider.getSigner()
    
    const steleTokenAddress = getSteleTokenAddress(network)
    const votesContract = new ethers.Contract(steleTokenAddress, ERC20VotesABI.abi, signer)

    // Delegate to self
    const tx = await votesContract.delegate(walletAddress)

    toast({
      title: "Transaction Submitted",
      description: "Delegation is being processed...",
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    toast({
      title: "Delegation Successful",
      description: "You have successfully delegated your tokens to yourself",
    })

    // Open transaction in explorer
    const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')

    return { success: true, transactionHash: receipt.hash }

  } catch (error: any) {
    console.error("Delegation error:", error)
    
    let errorMessage = "There was an error delegating your tokens. Please try again."
    let isUserRejection = false
    
    // Check for various user rejection patterns
    if (error.code === 4001 || 
        error.code === "ACTION_REJECTED" ||
        error.message?.includes('rejected') || 
        error.message?.includes('denied') || 
        error.message?.includes('cancelled') ||
        error.message?.includes('User rejected') ||
        error.message?.includes('User denied') ||
        error.message?.includes('Connection request was rejected')) {
      errorMessage = "Transaction was rejected by user"
      isUserRejection = true
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees"
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
    }

    // Only show error toast for non-user-rejection errors
    if (!isUserRejection) {
      toast({
        variant: "destructive",
        title: "Delegation Failed",
        description: errorMessage,
      })
    }
    
    return { success: false, error: errorMessage }
  }
}

// Get voting power at specific block
export const getVotingPowerAtBlock = async (
  walletAddress: string,
  blockNumber: string,
  network: NetworkType,
  getProvider: () => any
): Promise<string> => {
  try {
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available")
    }

    // Create a read-only provider for querying
    const readProvider = new ethers.JsonRpcProvider(provider.connection?.url || provider.provider?.connection?.url)
    const steleTokenAddress = getSteleTokenAddress(network)
    const votesContract = new ethers.Contract(steleTokenAddress, ERC20VotesABI.abi, readProvider)

    // Get voting power at the specific block
    const votingPower = await votesContract.getPastVotes(walletAddress, blockNumber)
    return votingPower.toString()

  } catch (error) {
    console.error("Error getting voting power:", error)
    return "0"
  }
}

// Check if user has already voted
export const checkUserVote = async (
  proposalId: string,
  walletAddress: string,
  network: NetworkType,
  getProvider: () => any
): Promise<{ hasVoted: boolean; userVote?: any }> => {
  try {
    const provider = await getProvider()
    if (!provider || !walletAddress) {
      return { hasVoted: false }
    }

    // Create a read-only provider for querying
    const readProvider = new ethers.JsonRpcProvider(provider.connection?.url || provider.provider?.connection?.url)
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, readProvider)

    // Check if user has voted
    const hasVoted = await governanceContract.hasVoted(proposalId, walletAddress)
    
    if (hasVoted) {
      // Try to get vote details (this might not be available in all Governor implementations)
      try {
        // This is a hypothetical method - actual implementation may vary
        const userVote = await governanceContract.getReceipt(proposalId, walletAddress)
        return { hasVoted: true, userVote }
      } catch {
        // If getReceipt is not available, just return hasVoted status
        return { hasVoted: true }
      }
    }

    return { hasVoted: false }

  } catch (error) {
    console.error("Error checking user vote:", error)
    return { hasVoted: false }
  }
} 