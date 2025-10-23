import { ethers } from "ethers"
import { getSteleTokenAddress, getSteleFundTokenAddress } from "@/lib/constants"
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
  t: (key: any) => string,
  pageType: 'challenge' | 'fund' = 'challenge'
): Promise<void> => {
  if (!walletAddress) {
    return
  }

  try {
    // Get provider - same as create proposal
    const provider = await getProvider();
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.");
    }

    // Connect to provider with signer (same as create proposal)
    const signer = await provider.getSigner()

    // Get the correct token address based on page type
    const steleTokenAddress = pageType === 'fund'
      ? getSteleFundTokenAddress(subgraphNetwork)
      : getSteleTokenAddress(subgraphNetwork)

    const votesContract = new ethers.Contract(steleTokenAddress, ERC20VotesABI.abi, signer)

    // Delegate to self
    const tx = await votesContract.delegate(walletAddress)

    // Wait for transaction confirmation
    await tx.wait()

    // Refresh wallet token info after delegation
    setTimeout(() => {
      // This will trigger a re-fetch of wallet token info
      refetchWalletTokenInfo()
    }, 3000)

  } catch (error: any) {
    console.error("Delegation error:", error)
    throw error // Re-throw to handle loading state in calling component
  }
} 