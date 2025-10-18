import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { 
  NetworkType, 
  ProposalStatus, 
  ProposalState,
  BlockchainActionResult,
  ContractInteractionParams,
  ProposalDetails
} from "../components/types"
import { getGovernanceContractAddress } from "@/lib/constants"
import GovernorABI from "@/app/abis/SteleGovernor.json"
import { mapProposalStateToStatus } from "./proposal-detail"

// Helper function to switch wallet network
const switchToNetwork = async (provider: any, network: NetworkType) => {
  const expectedChainId = network === 'arbitrum' ? '0xa4b1' : '0x1';
  const walletChainId = await provider.send('eth_chainId', []);
  
  if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: expectedChainId }
      ]);
    } catch (switchError: any) {
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
          
          await provider.send('wallet_addEthereumChain', [networkParams]);
        } catch (addError) {
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
        }
      } else if (switchError.code === 4001) {
        const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
        throw new Error(`Please switch to ${networkName} network to continue.`);
      } else {
        throw switchError;
      }
    }
  }
};

// Handle queue operation
export const handleQueue = async (
  proposalDetails: ProposalDetails,
  walletConnected: boolean,
  walletType: string | null,
  network: NetworkType,
  getProvider: () => any,
  t: (key: any) => string
): Promise<BlockchainActionResult> => {
  try {
    if (!walletConnected || !proposalDetails) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or proposal data not available.",
      })
      return { success: false, error: "Wallet not connected or no proposal data" }
    }

    // WalletConnect only - use getProvider from useWallet hook
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.")
    }

    // Switch to correct network if needed
    await switchToNetwork(provider, network);
    
    // Get signer after ensuring correct network
    const signer = await provider.getSigner()
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, signer)

    // Prepare queue parameters
    const targets = proposalDetails.targets || []
    const values = proposalDetails.values || []
    const calldatas = proposalDetails.calldatas || []
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))

    // Call queue function
    const tx = await governanceContract.queue(targets, values, calldatas, descriptionHash)
    
    toast({
      title: "Transaction Submitted",
      description: "Your queue transaction has been submitted. Please wait for confirmation.",
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()
    
    if (receipt.status === 1) {
      toast({
        title: "Proposal Queued Successfully",
        description: `Proposal #${proposalDetails.proposalId} has been queued for execution.`,
      })
      
      // Open transaction in explorer
      const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
      window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')
      
      return { success: true, transactionHash: receipt.hash }
    } else {
      throw new Error('Transaction failed')
    }

  } catch (error: any) {
    console.error("Queue error:", error)
    
    let errorMessage = "There was an error queuing the proposal. Please try again."
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
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
    } else if (error.message?.includes("Governor: proposal not successful")) {
      errorMessage = "Proposal has not succeeded yet and cannot be queued"
    }

    // Only show error toast for non-user-rejection errors
    if (!isUserRejection) {
      toast({
        variant: "destructive",
        title: "Queue Failed",
        description: errorMessage,
      })
    }

    return { success: false, error: errorMessage }
  }
}

// Handle execute operation
export const handleExecute = async (
  proposalDetails: ProposalDetails,
  walletConnected: boolean,
  walletType: string | null,
  network: NetworkType,
  getProvider: () => any,
  t: (key: any) => string
): Promise<BlockchainActionResult> => {
  try {
    if (!walletConnected || !proposalDetails) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or proposal data not available.",
      })
      return { success: false, error: "Wallet not connected or no proposal data" }
    }

    // WalletConnect only - use getProvider from useWallet hook
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.")
    }

    // Switch to correct network if needed
    await switchToNetwork(provider, network);
    
    // Get signer after ensuring correct network
    const signer = await provider.getSigner()
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, signer)

    // Double-check proposal state before executing
    const currentState = await governanceContract.state(proposalDetails.proposalId)
    const status = mapProposalStateToStatus(currentState)
    
    if (status !== 'queued') {
      throw new Error(`Proposal is not ready for execution. Current status: ${status}`)
    }

    // Prepare execute parameters
    const targets = proposalDetails.targets || []
    const values = proposalDetails.values || []
    const calldatas = proposalDetails.calldatas || []
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))

    // Call execute function
    const tx = await governanceContract.execute(targets, values, calldatas, descriptionHash)
    
    toast({
      title: "Transaction Submitted",
      description: "Your execute transaction has been submitted. Please wait for confirmation.",
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()
    
    if (receipt.status === 1) {
      toast({
        title: "Proposal Executed Successfully",
        description: `Proposal #${proposalDetails.proposalId} has been executed successfully.`,
      })
      
      // Open transaction in explorer
      const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
      window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')
      
      return { success: true, transactionHash: receipt.hash }
    } else {
      throw new Error('Transaction failed')
    }

  } catch (error: any) {
    console.error("Execute error:", error)
    
    let errorMessage = "There was an error executing the proposal. Please try again."
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
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
    } else if (error.message?.includes("Governor: proposal not in execution state")) {
      errorMessage = "Proposal is not ready for execution. Please ensure it has been queued and the timelock has passed."
    }

    // Only show error toast for non-user-rejection errors
    if (!isUserRejection) {
      toast({
        variant: "destructive",
        title: "Execute Failed",
        description: errorMessage,
      })
    }

    return { success: false, error: errorMessage }
  }
}

// Handle cancel operation
export const handleCancel = async (
  proposalDetails: ProposalDetails,
  walletConnected: boolean,
  walletType: string | null,
  network: NetworkType,
  getProvider: () => any,
  t: (key: any) => string
): Promise<BlockchainActionResult> => {
  try {
    if (!walletConnected || !proposalDetails) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or proposal data not available.",
      })
      return { success: false, error: "Wallet not connected or no proposal data" }
    }

    // WalletConnect only - use getProvider from useWallet hook
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.")
    }

    // Connect to provider with signer
    const signer = await provider.getSigner()
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, signer)

    // Prepare cancel parameters
    const targets = proposalDetails.targets || []
    const values = proposalDetails.values || []
    const calldatas = proposalDetails.calldatas || []
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))

    // Call cancel function
    const tx = await governanceContract.cancel(targets, values, calldatas, descriptionHash)
    
    toast({
      title: "Transaction Submitted",
      description: "Your cancel transaction has been submitted. Please wait for confirmation.",
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()
    
    if (receipt.status === 1) {
      toast({
        title: "Proposal Canceled Successfully",
        description: `Proposal #${proposalDetails.proposalId} has been canceled.`,
      })
      
      // Open transaction in explorer
      const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
      window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')
      
      return { success: true, transactionHash: receipt.hash }
    } else {
      throw new Error('Transaction failed')
    }

  } catch (error: any) {
    console.error("Cancel error:", error)
    
    let errorMessage = "There was an error canceling the proposal. Please try again."
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
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
    } else if (error.message?.includes("Governor: proposer above threshold")) {
      errorMessage = "Cannot cancel proposal - proposer still has sufficient voting power"
    }

    // Only show error toast for non-user-rejection errors
    if (!isUserRejection) {
      toast({
        variant: "destructive",
        title: "Cancel Failed",
        description: errorMessage,
      })
    }

    return { success: false, error: errorMessage }
  }
}

// Check current proposal state from blockchain
export const checkProposalState = async (
  proposalId: string,
  network: NetworkType,
  getProvider: () => any
): Promise<ProposalStatus> => {
  try {
    const provider = await getProvider()
    if (!provider) {
      throw new Error("No provider available")
    }

    // Create a read-only provider for querying
    const readProvider = new ethers.JsonRpcProvider(provider.connection?.url || provider.provider?.connection?.url)
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, readProvider)

    // Get current proposal state
    const currentState: ProposalState = await governanceContract.state(proposalId)
    return mapProposalStateToStatus(currentState)

  } catch (error) {
    console.error("Error checking proposal state:", error)
    return 'pending' // Default fallback
  }
}

// Get proposal deadline (timelock delay for queued proposals)
export const getProposalDeadline = async (
  proposalId: string,
  network: NetworkType,
  getProvider: () => any
): Promise<Date | null> => {
  try {
    const provider = await getProvider()
    if (!provider) {
      return null
    }

    // Create a read-only provider for querying
    const readProvider = new ethers.JsonRpcProvider(provider.connection?.url || provider.provider?.connection?.url)
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, readProvider)

    // Try to get proposal deadline (may not be available in all implementations)
    try {
      const deadline = await governanceContract.proposalDeadline(proposalId)
      return new Date(deadline.toNumber() * 1000)
    } catch {
      // If deadline method is not available, return null
      return null
    }

  } catch (error) {
    console.error("Error getting proposal deadline:", error)
    return null
  }
}

// Get proposal snapshot (block number when voting started)
export const getProposalSnapshot = async (
  proposalId: string,
  network: NetworkType,
  getProvider: () => any
): Promise<number | null> => {
  try {
    const provider = await getProvider()
    if (!provider) {
      return null
    }

    // Create a read-only provider for querying
    const readProvider = new ethers.JsonRpcProvider(provider.connection?.url || provider.provider?.connection?.url)
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, readProvider)

    // Get proposal snapshot block
    const snapshot = await governanceContract.proposalSnapshot(proposalId)
    return snapshot.toNumber()

  } catch (error) {
    console.error("Error getting proposal snapshot:", error)
    return null
  }
}

// Estimate gas for proposal operations
export const estimateGas = async (
  operation: 'vote' | 'queue' | 'execute' | 'cancel',
  proposalDetails: ProposalDetails,
  network: NetworkType,
  getProvider: () => any,
  walletAddress?: string
): Promise<{ gasLimit: string; gasPrice: string } | null> => {
  try {
    const provider = await getProvider()
    if (!provider) {
      return null
    }

    const signer = await provider.getSigner()
    const governanceContract = new ethers.Contract(getGovernanceContractAddress(network), GovernorABI.abi, signer)

    let gasEstimate: any

    switch (operation) {
      case 'vote':
        if (!walletAddress) return null
        gasEstimate = await governanceContract.castVote.estimateGas(proposalDetails.proposalId, 1) // Assuming 'for' vote
        break
      
      case 'queue':
      case 'execute':
      case 'cancel':
        const targets = proposalDetails.targets || []
        const values = proposalDetails.values || []
        const calldatas = proposalDetails.calldatas || []
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))
        
        if (operation === 'queue') {
          gasEstimate = await governanceContract.queue.estimateGas(targets, values, calldatas, descriptionHash)
        } else if (operation === 'execute') {
          gasEstimate = await governanceContract.execute.estimateGas(targets, values, calldatas, descriptionHash)
        } else {
          gasEstimate = await governanceContract.cancel.estimateGas(targets, values, calldatas, descriptionHash)
        }
        break
      
      default:
        return null
    }

    const gasPrice = await provider.getGasPrice?.() || await provider.getFeeData?.()
    
    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: gasPrice?.toString() || '0'
    }

  } catch (error) {
    console.error(`Error estimating gas for ${operation}:`, error)
    return null
  }
} 