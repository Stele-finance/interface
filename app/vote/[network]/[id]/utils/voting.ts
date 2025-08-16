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
      toast({
        variant: "destructive",
        title: "Vote Option Required",
        description: "Please select a vote option",
      })
      return { success: false, error: "No vote option selected" }
    }

    if (!walletConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote",
      })
      return { success: false, error: "Wallet not connected" }
    }

    if (Number(votingPower) === 0) {
      toast({
        variant: "destructive",
        title: "No Voting Power",
        description: "You don't have any voting power for this proposal",
      })
      return { success: false, error: "No voting power" }
    }

    if (!walletConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.")
    }

    // Get current connected address from wallet and provider
    let currentConnectedAddress: string
    let browserProvider: any
    
    if (walletType === 'walletconnect') {
      // For WalletConnect, use the address from useWallet hook
      if (!walletAddress) {
        throw new Error("No WalletConnect address available")
      }
      currentConnectedAddress = walletAddress
      browserProvider = getProvider()
    } else {
      // For MetaMask and Phantom, use provider method
      browserProvider = getProvider()
      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.")
      }

      const accounts = await browserProvider.send('eth_requestAccounts', [])
      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts connected in ${walletType} wallet`)
      }
      currentConnectedAddress = accounts[0]
    }

    if (!browserProvider) {
      throw new Error("Failed to get wallet provider. Please reconnect your wallet.")
    }
    
    // Get wallet's current network
    const walletChainId = await browserProvider.send('eth_chainId', []);
    const expectedChainId = network === 'arbitrum' ? '0xa4b1' : '0x1';
    
    // If wallet is on wrong network, switch to URL-based network
    if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
      try {
        // Request network switch
        await browserProvider.send('wallet_switchEthereumChain', [
          { chainId: expectedChainId }
        ]);
      } catch (switchError: any) {
        // If network doesn't exist in wallet (error 4902), add it
        if (switchError.code === 4902) {
          try {
            const networkParams = network === 'arbitrum' ? {
              chainId: expectedChainId,
              chainName: 'Arbitrum One',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://arbiscan.io']
            } : {
              chainId: expectedChainId,
              chainName: 'Ethereum Mainnet',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
              blockExplorerUrls: ['https://etherscan.io']
            };
            
            await browserProvider.send('wallet_addEthereumChain', [networkParams]);
          } catch (addError) {
            const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
          }
        } else if (switchError.code === 4001) {
          // User rejected the switch
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to vote.`);
        } else {
          throw switchError;
        }
      }
    }
    
    // Get signer after ensuring correct network
    const signer = await browserProvider.getSigner()
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

    toast({
      title: "Transaction Submitted",
      description: "Your vote is being processed...",
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()
    
    // Vote success message
    toast({
      title: "Vote Cast Successfully",
      description: `You have voted ${voteOption} on proposal ${proposalId} with ${Number(votingPower).toLocaleString()} voting power`,
    })

    // Open transaction in explorer
    const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')

    return { success: true, transactionHash: receipt.hash }

  } catch (error: any) {
    console.error("Voting error:", error)
    
    let errorMessage = "There was an error casting your vote. Please try again."
    let isUserRejection = false
    
    // Check for various user rejection patterns
    if (error.code === 4001 || 
        error.code === "ACTION_REJECTED" ||
        error.message?.includes("rejected") ||
        error.message?.includes("denied") ||
        error.message?.includes("cancelled") ||
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.message?.includes("Transaction was rejected")) {
      errorMessage = "Transaction was rejected by user"
      isUserRejection = true
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees"
    } else if (error.message?.includes("already voted")) {
      errorMessage = "You have already voted on this proposal"
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
    } else if (error.message?.includes("No accounts connected")) {
      errorMessage = "No accounts connected in Phantom wallet. Please connect your wallet first."
    }

    // Only show error toast for non-user-rejection errors
    if (!isUserRejection) {
      toast({
        variant: "destructive",
        title: "Voting Failed",
        description: errorMessage,
      })
    }

    return { success: false, error: errorMessage }
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

    // WalletConnect only - use getProvider from useWallet hook
    const provider = getProvider()
    if (!provider || walletType !== 'walletconnect') {
      throw new Error("WalletConnect not available. Please connect your wallet first.")
    }

    // Try to get signer first, only request accounts if needed
    let signer
    try {
      signer = await provider.getSigner()
      await signer.getAddress() // Verify we can get address
    } catch (error: any) {
      console.warn('Could not get signer, requesting accounts:', error)
      
      // Check if user rejected the request
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error("Connection request was rejected by user")
      }
      
      // Request wallet connection as fallback
      await provider.send('eth_requestAccounts', [])
      signer = await provider.getSigner()
    }
    
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
    const provider = getProvider()
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
    const provider = getProvider()
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