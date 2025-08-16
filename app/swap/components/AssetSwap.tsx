"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useSwapTokenPricesIndependent } from "@/app/hooks/useUniswapBatchPrices"
import { useInvestableTokensForSwap } from "@/app/hooks/useInvestableTokens"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ethers } from "ethers"

// Import components
import { SwapInput } from "./SwapInput"
import { SwapButton } from "./SwapButton"
import { ExchangeRate } from "./ExchangeRate"

// Import types and utils
import { AssetSwapProps, PriceData, SwapQuote } from "./types"
import { 
  getTokenAddress, 
  getTokenDecimals, 
  getFormattedTokenBalance,
  getAvailableTokens 
} from "../utils/token"
import {
  calculateUniswapSwapQuote,
  isAmountExceedsBalance,
  isBelowMinimumSwapAmount,
  getSwapAmountUSD,
  handlePercentageClick as utilHandlePercentageClick,
  calculateOutputAmount
} from "../utils/swap"

// Import constants and contract utilities
import { 
  getSteleContractAddress, 
  getChainId, 
  getChainConfig, 
  buildTransactionUrl, 
  getExplorerName 
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"

export function AssetSwap({ className, userTokens = [], onSwappingStateChange, ...props }: AssetSwapProps) {
  const { t } = useLanguage()
  const { walletType, getProvider, isConnected } = useWallet()
  
  // Get network from URL path instead of wallet
  const pathParts = window.location.pathname.split('/');
  const networkFromUrl = pathParts.find(part => part === 'ethereum' || part === 'arbitrum') || 'ethereum';
  const subgraphNetwork = networkFromUrl as 'ethereum' | 'arbitrum';
  
  const { tokens: investableTokens, isLoading: isLoadingInvestableTokens, error: investableTokensError } = useInvestableTokensForSwap(subgraphNetwork);
  const [fromAmount, setFromAmount] = useState<string>("")
  const [fromToken, setFromToken] = useState<string>("")
  const [toToken, setToToken] = useState<string>("WETH")
  const [isSwapping, setIsSwapping] = useState(false)
  
  // Notify parent component when swapping state changes
  useEffect(() => {
    onSwappingStateChange?.(isSwapping);
  }, [isSwapping, onSwappingStateChange]);

  // Get challengeId from URL params for contract call
  const params = useParams()
  const challengeId = params?.id || params?.challengeId || "1"

  // Create utility functions with bound parameters
  const getTokenAddressUtil = useCallback((tokenSymbol: string) => 
    getTokenAddress(tokenSymbol, userTokens, investableTokens), [userTokens, investableTokens])
  
  const getTokenDecimalsUtil = useCallback((tokenSymbol: string) => 
    getTokenDecimals(tokenSymbol, userTokens, investableTokens), [userTokens, investableTokens])

  const getFormattedTokenBalanceUtil = useCallback((tokenSymbol: string) => 
    getFormattedTokenBalance(tokenSymbol, userTokens), [userTokens])

  // Use new cached hook to get prices for selected tokens only
  const {
    fromTokenPrice,
    toTokenPrice,
    isLoading,
    error,
    calculateSimpleSwapQuote,
    refetch
  } = useSwapTokenPricesIndependent(
    fromToken,
    toToken,
    getTokenAddressUtil,
    getTokenDecimalsUtil,
    subgraphNetwork
  );

  // Create compatible priceData structure for existing code
  const priceData: PriceData | null = fromTokenPrice && toTokenPrice ? {
    tokens: {
      [fromToken]: { priceUSD: fromTokenPrice },
      [toToken]: { priceUSD: toTokenPrice }
    },
    timestamp: Date.now(),
    source: 'cached'
  } : null;

  // Initialize toToken when investable tokens are available (keep WETH if available)
  useEffect(() => {
    if (investableTokens.length > 0 && toToken === "WETH") {
      // Check if WETH is available in investable tokens, otherwise keep the initial WETH value
      const wethToken = investableTokens.find(token => token.symbol === "WETH");
      if (!wethToken) {
        // If WETH is not available, fallback to first available token
        setToToken(investableTokens[0].symbol);
      }
    }
  }, [investableTokens, toToken]);

  // Auto-change toToken if it becomes the same as fromToken
  useEffect(() => {
    if (fromToken && toToken && fromToken === toToken) {
      // Find the first available token that's different from fromToken
      const differentToken = investableTokens
        .map(token => token.symbol)
        .find(symbol => symbol !== fromToken);
      
      if (differentToken) {
        setToToken(differentToken);
      }
    }
  }, [fromToken, toToken, investableTokens]);

  const swapQuote = calculateUniswapSwapQuote(
    fromToken,
    toToken,
    parseFloat(fromAmount) || 0,
    priceData
  );

  // NEW: Get immediate simple swap quote for instant feedback
  const simpleSwapQuote = calculateSimpleSwapQuote(parseFloat(fromAmount) || 0);

  // Check if selected tokens have price data available
  const hasFromTokenData = fromToken ? priceData?.tokens?.[fromToken] !== undefined : true;
  const hasToTokenData = toToken ? priceData?.tokens?.[toToken] !== undefined : true;

  // Simplified data ready check - focus on essential conditions
  const isDataReady = !isLoadingInvestableTokens && !investableTokensError;

  // Get available tokens
  const { availableFromTokens, availableToTokens } = getAvailableTokens(
    userTokens, 
    investableTokens, 
    priceData, 
    fromToken
  );

  const handleTokenSwap = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  // Bound utility functions for components
  const isAmountExceedsBalanceUtil = useCallback(() => 
    isAmountExceedsBalance(fromAmount, fromToken, userTokens), [fromAmount, fromToken, userTokens])
  
  const isBelowMinimumSwapAmountUtil = useCallback(() => 
    isBelowMinimumSwapAmount(fromAmount, fromToken, priceData, fromTokenPrice || undefined), [fromAmount, fromToken, priceData, fromTokenPrice])
  
  const getSwapAmountUSDUtil = useCallback(() => 
    getSwapAmountUSD(fromAmount, fromToken, priceData, fromTokenPrice || undefined), [fromAmount, fromToken, priceData, fromTokenPrice])

  const handlePercentageClickUtil = useCallback((percentage: number) => 
    utilHandlePercentageClick(percentage, fromToken, userTokens, getTokenDecimalsUtil, setFromAmount), 
    [fromToken, userTokens, getTokenDecimalsUtil])

  // Calculate actual output amount based on user input
  const outputAmount = calculateOutputAmount(
    fromAmount,
    swapQuote,
    simpleSwapQuote,
    getTokenDecimalsUtil,
    toToken
  );

  // Execute swap on blockchain - using dynamic import for ethers
  const handleSwapTransaction = async () => {
    if (!fromAmount || !fromToken || !toToken) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select tokens and enter an amount.",
      });
      return;
    }

    if (parseFloat(fromAmount) <= 0) {
      toast({
        variant: "destructive",
        title: t('invalidAmount'),
        description: t('enterValidAmount'),
      });
      return;
    }

    // Check if user has sufficient balance - use same logic as isAmountExceedsBalance
    if (isAmountExceedsBalanceUtil()) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken}.`,
      });
      return;
    }

    // Check if wallet is connected
    if (!isConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsSwapping(true);

    try {
      // Get provider using useWallet hook
      const browserProvider = getProvider();
      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
      }
        
      // Try to get address from signer first before requesting accounts
      let userAddress: string | null = null;
    
      try {
        const signer = await browserProvider.getSigner();
        userAddress = await signer.getAddress();
      } catch (error: any) {
        console.warn('Could not get address from signer, requesting accounts:', error);
        
        // Check if user rejected the request
        if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
          throw new Error("Connection request was rejected by user");
        }
        
        // Only request accounts if we can't get address from signer
        const accounts = await browserProvider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found. Please connect to ${walletType} wallet first.`);
        }
        userAddress = accounts[0];
      }

      if (!userAddress) {
        throw new Error('Could not determine user address');
      }

      // Get wallet's current network
      const walletChainId = await browserProvider.send('eth_chainId', []);
      const expectedChainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
      
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
              
              await browserProvider.send('wallet_addEthereumChain', [networkParams]);
            } catch (addError) {
              const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
              throw new Error(`Failed to add ${networkName} network. Please add it manually in your wallet settings.`);
            }
          } else if (switchError.code === 4001) {
            // User rejected the switch
            const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
            throw new Error(`Please switch to ${networkName} network to perform swap.`);
          } else {
            throw switchError;
          }
        }
      }

      // Use existing browserProvider and get signer
      const signer = await browserProvider.getSigner();
      
      // Create contract instance with URL-based network
      const steleContract = new ethers.Contract(
        getSteleContractAddress(subgraphNetwork),
        SteleABI.abi,
        signer
      );

      // Get token addresses
      const fromTokenAddress = getTokenAddressUtil(fromToken);
      const toTokenAddress = getTokenAddressUtil(toToken);

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Could not find token addresses. From: ${fromToken} (${fromTokenAddress}), To: ${toToken} (${toTokenAddress}). Please make sure the tokens are supported.`);
      }

      // Convert amount to wei format based on token decimals
      const fromTokenDecimals = getTokenDecimalsUtil(fromToken);
      
      // Fix decimal precision to match token decimals to prevent parseUnits error
      const numericAmount = parseFloat(fromAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error(t('invalidAmountFormat'));
      }
      
      // Preserve user input while preventing token decimals overflow
      let adjustedAmount = fromAmount;
      const decimalIndex = fromAmount.indexOf('.');
      
      if (decimalIndex !== -1) {
        const decimalPlaces = fromAmount.length - decimalIndex - 1;
        if (decimalPlaces > fromTokenDecimals) {
          // Trim if more decimal places than token decimals
          adjustedAmount = numericAmount.toFixed(fromTokenDecimals);
        }
      }
      
      const amountInWei = ethers.parseUnits(adjustedAmount, fromTokenDecimals);
      
      // Call the swap function
      const tx = await steleContract.swap(
        challengeId,
        fromTokenAddress,
        toTokenAddress,
        amountInWei
      );

      // Get network-specific explorer info
      const explorerName = getExplorerName(subgraphNetwork);
      const submittedTxUrl = buildTransactionUrl(subgraphNetwork, tx.hash);
      
      toast({
        title: "Transaction Submitted",
        description: "Your swap transaction has been sent to the network.",
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(submittedTxUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        const confirmedTxUrl = buildTransactionUrl(subgraphNetwork, receipt.hash);
        
        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken} for ${toToken}!`,
          action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(confirmedTxUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
          ),
        });

        // Clear the form
        setFromAmount("");
        
        // Refresh price data
        refetch();
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error("Swap error:", error);
      
      let errorMessage = "An error occurred while swapping. Please try again.";
      let toastVariant: "destructive" | "default" = "destructive";
      let toastTitle = "Swap Failed";
      
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied') || error.message?.includes('Connection request was rejected')) {
        errorMessage = "Transaction was cancelled by user";
        toastVariant = "default";
        toastTitle = "Transaction Cancelled";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error.message?.includes("Could not find token addresses")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: toastVariant,
        title: toastTitle, 
        description: errorMessage,
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className={cn("max-w-md mx-auto", className)} {...props}>
      <Card className="bg-transparent border-0">
        <CardContent className="p-0 space-y-3">
          {/* From Token */}
          <SwapInput
            amount={fromAmount}
            token={fromToken}
            onAmountChange={setFromAmount}
            onTokenSelect={setFromToken}
            availableTokens={availableFromTokens}
            userTokens={userTokens}
            isFrom={true}
            subgraphNetwork={subgraphNetwork}
            getTokenAddress={getTokenAddressUtil}
            getTokenDecimals={getTokenDecimalsUtil}
            getFormattedTokenBalance={getFormattedTokenBalanceUtil}
            handlePercentageClick={handlePercentageClickUtil}
            getSwapAmountUSD={getSwapAmountUSDUtil}
            isBelowMinimumSwapAmount={isBelowMinimumSwapAmountUtil}
            isAmountExceedsBalance={isAmountExceedsBalanceUtil}
          />

          {/* Swap Arrow */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTokenSwap}
              className="p-2 rounded-full bg-muted/60 border-0 hover:bg-muted/80"
            >
              <ArrowDown className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* To Token */}
          <SwapInput
            amount={outputAmount}
            token={toToken}
            onAmountChange={() => {}} // Read-only for output
            onTokenSelect={setToToken}
            availableTokens={availableToTokens}
            userTokens={userTokens}
            isFrom={false}
            subgraphNetwork={subgraphNetwork}
            getTokenAddress={getTokenAddressUtil}
            getTokenDecimals={getTokenDecimalsUtil}
            getFormattedTokenBalance={getFormattedTokenBalanceUtil}
            priceData={priceData}
            toTokenPrice={toTokenPrice || undefined}
          />

          {/* Exchange Rate */}
          <ExchangeRate
            isDataReady={isDataReady}
            fromToken={fromToken}
            toToken={toToken}
            swapQuote={swapQuote}
            simpleSwapQuote={simpleSwapQuote}
            getTokenDecimals={getTokenDecimalsUtil}
          />

          {/* Swap Button */}
          <SwapButton
            fromAmount={fromAmount}
            fromToken={fromToken}
            toToken={toToken}
            isDataReady={isDataReady}
            isSwapping={isSwapping}
            isAmountExceedsBalance={isAmountExceedsBalanceUtil}
            isBelowMinimumSwapAmount={isBelowMinimumSwapAmountUtil}
            onSwap={handleSwapTransaction}
            t={t}
          />
        </CardContent>
      </Card>
    </div>
  )
}
