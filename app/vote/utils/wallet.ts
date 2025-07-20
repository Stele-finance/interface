import { ethers } from "ethers"
import { getSteleTokenAddress } from "@/lib/constants"
import ERC20VotesABI from "@/app/abis/ERC20Votes.json"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// Delegate tokens to self
export const handleDelegate = async (
  walletAddress: string | undefined,
  walletType: string | undefined,
  subgraphNetwork: 'ethereum' | 'arbitrum',
  getProvider: () => any,
  refetchWalletTokenInfo: () => void,
  t: (key: any) => string
): Promise<void> => {
  if (!walletAddress) {
    toast({
      variant: "destructive",
      title: t('walletNotConnected'),
      description: t('connectWallet'),
    })
    return
  }

  try {
    // WalletConnect only - use getProvider from useWallet hook
    const provider = getProvider();
    if (!provider || walletType !== 'walletconnect') {
      throw new Error("WalletConnect not available. Please connect your wallet first.");
    }

    // Try to get signer first, only request accounts if needed
    let signer;
    try {
      signer = await provider.getSigner();
      await signer.getAddress(); // Verify we can get address
    } catch (error: any) {
      console.warn('Could not get signer, requesting accounts:', error);
      
      // Check if user rejected the request
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error("Connection request was rejected by user");
      }
      
      // Request wallet connection as fallback
      await provider.send('eth_requestAccounts', [])
      signer = await provider.getSigner();
    }
    
    const steleTokenAddress = getSteleTokenAddress(subgraphNetwork)
    const votesContract = new ethers.Contract(steleTokenAddress, ERC20VotesABI.abi, signer)

    // Delegate to self
    const tx = await votesContract.delegate(walletAddress)

    toast({
      title: t('transactionSubmitted'),
      description: t('delegationProcessing'),
    })

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    toast({
      title: t('delegationSuccessful'),
      description: t('delegationSuccessfulMessage'),
    })
    
    // Open transaction in explorer
    window.open(`https://etherscan.io/tx/${receipt.hash}`, '_blank')

    // Refresh wallet token info after delegation
    setTimeout(() => {
      // This will trigger a re-fetch of wallet token info
      refetchWalletTokenInfo()
    }, 3000)

  } catch (error: any) {
    console.error("Delegation error:", error)
    
    let errorMessage = t('errorDelegatingTokens')
    let toastVariant: "destructive" | "default" = "destructive"
    let toastTitle = t('delegationFailed')
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
      errorMessage = t('transactionRejected')
      toastVariant = "default"
      toastTitle = "Request Cancelled"
      isUserRejection = true
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = t('insufficientFundsGas')
    } else if (error.message?.includes("Phantom wallet is not installed")) {
      errorMessage = t('phantomWalletNotInstalled')
    }

    // Show toast for all cases (user rejection gets a neutral variant)
    toast({
      variant: toastVariant,
      title: toastTitle,
      description: errorMessage,
    })
    
    throw error // Re-throw to handle loading state in calling component
  }
} 