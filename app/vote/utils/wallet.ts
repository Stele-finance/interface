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
    toast({
      variant: "destructive",
      title: t('walletNotConnected'),
      description: t('connectWallet'),
    })
    return
  }

  try {
    // WalletConnect only - use getProvider from useWallet hook
    const provider = await getProvider();
    if (!provider) {
      throw new Error("No provider available. Please connect your wallet first.");
    }

    // Get wallet's current network
    const walletChainId = await provider.send('eth_chainId', []);
    const expectedChainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
    
    // If wallet is on wrong network, switch to selected network
    if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
      try {
        // Request network switch
        await provider.send('wallet_switchEthereumChain', [
          { chainId: expectedChainId }
        ]);
      } catch (switchError: any) {
        // If network doesn't exist in wallet (error 4902), add it
        if (switchError.code === 4902) {
          try {
            const networkParams = subgraphNetwork === 'arbitrum' ? {
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
            const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
          }
        } else if (switchError.code === 4001) {
          // User rejected the switch
          const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to delegate tokens.`);
        } else {
          throw switchError;
        }
      }
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
    
    // Get the correct token address based on page type
    const steleTokenAddress = pageType === 'fund' 
      ? getSteleFundTokenAddress(subgraphNetwork)
      : getSteleTokenAddress(subgraphNetwork)
    
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
    const explorerUrl = subgraphNetwork === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    window.open(`${explorerUrl}/tx/${receipt.hash}`, '_blank')

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