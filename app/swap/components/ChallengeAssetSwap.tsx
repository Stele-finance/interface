"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useTokenPrices } from "@/lib/token-price-context"
import { useChallengeInvestableTokensForSwap } from "@/app/hooks/useChallengeInvestableTokens"
// Fund hooks not needed for challenge swaps
// Fund settings not needed for challenge swaps
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ethers } from "ethers"

// Import components
import { SwapInput } from "./SwapInput"
import { SwapButton } from "./SwapButton"
import { ExchangeRate } from "./ExchangeRate"

// Import types and utils
import { AssetSwapProps, PriceData, SwapQuote, SimpleSwapQuote } from "./types"
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
// Fund ABI not needed for challenge swaps

export function ChallengeAssetSwap({ className, userTokens = [], investableTokens: externalInvestableTokens, onSwappingStateChange, ...props }: AssetSwapProps) {
  const { t } = useLanguage()
  const { walletType, getProvider, isConnected } = useWallet()
  
  // Get network from URL path instead of wallet
  const pathParts = window.location.pathname.split('/');
  const networkFromUrl = pathParts.find(part => part === 'ethereum' || part === 'arbitrum') || 'ethereum';
  const subgraphNetwork = networkFromUrl as 'ethereum' | 'arbitrum';
  
  // This is always a challenge swap
  const isFundSwap = false;
  
  // Use external investableTokens if provided, otherwise fetch from subgraph
  const { tokens: challengeTokens, isLoading: isLoadingChallengeTokens, error: challengeTokensError } = useChallengeInvestableTokensForSwap(subgraphNetwork);
  // Only use challenge tokens
  const fetchedInvestableTokens = challengeTokens;
  const isLoadingInvestableTokens = isLoadingChallengeTokens;
  const investableTokensError = challengeTokensError;

  const investableTokens = externalInvestableTokens || fetchedInvestableTokens;
  
  // If externalInvestableTokens are provided, we're not loading from the hook
  const effectiveIsLoadingInvestableTokens = externalInvestableTokens ? false : isLoadingInvestableTokens;
  
  // Fund settings not needed for challenge swaps
  const [fromAmount, setFromAmount] = useState<string>("")
  const [fromToken, setFromToken] = useState<string>("")
  const [toToken, setToToken] = useState<string>("")
  const [isSwapping, setIsSwapping] = useState(false)
  
  // Notify parent component when swapping state changes
  useEffect(() => {
    onSwappingStateChange?.(isSwapping);
  }, [isSwapping, onSwappingStateChange]);

  // Get challengeId or fundId from URL params for contract call
  const params = useParams()
  const challengeId = params?.id || params?.challengeId || "1"
  // No fund ID needed for challenge swaps

  // Create utility functions with bound parameters
  const getTokenAddressUtil = useCallback((tokenSymbol: string) => 
    getTokenAddress(tokenSymbol, userTokens, investableTokens), [userTokens, investableTokens])
  
  const getTokenDecimalsUtil = useCallback((tokenSymbol: string) => 
    getTokenDecimals(tokenSymbol, userTokens, investableTokens), [userTokens, investableTokens])

  const getFormattedTokenBalanceUtil = useCallback((tokenSymbol: string) => 
    getFormattedTokenBalance(tokenSymbol, userTokens), [userTokens])

  // Get token prices from global context
  const { getTokenPriceBySymbol, error } = useTokenPrices()
  
  // Get individual token prices
  const fromTokenPrice = fromToken ? getTokenPriceBySymbol(fromToken)?.priceUSD || 0 : 0
  const toTokenPrice = toToken ? getTokenPriceBySymbol(toToken)?.priceUSD || 0 : 0
  
  // Simple swap quote calculator (used by the component)
  const calculateSimpleSwapQuote = useCallback((amount: number): SimpleSwapQuote | null => {
    if (!fromTokenPrice || !toTokenPrice || amount <= 0) return null
    const toAmount = (amount * fromTokenPrice) / toTokenPrice
    return {
      toAmount,
      exchangeRate: fromTokenPrice / toTokenPrice
    }
  }, [fromTokenPrice, toTokenPrice])

  // Create compatible priceData structure for existing code
  const priceData = useMemo<PriceData | null>(() => {
    return fromTokenPrice && toTokenPrice ? {
      tokens: {
        [fromToken]: { priceUSD: fromTokenPrice },
        [toToken]: { priceUSD: toTokenPrice }
      },
      timestamp: Date.now(),
      source: 'cached'
    } : null;
  }, [fromTokenPrice, toTokenPrice, fromToken, toToken]);

  // Initialize tokens when they become available
  useEffect(() => {
    // Initialize fromToken with first available user token
    if (userTokens.length > 0 && !fromToken) {
      setFromToken(userTokens[0].symbol);
    }
    
    // Initialize toToken with first available investable token
    if (investableTokens.length > 0 && !toToken) {
      // Try to find WETH first, otherwise use first available
      const wethToken = investableTokens.find(token => token.symbol === "WETH");
      setToToken(wethToken ? "WETH" : investableTokens[0].symbol);
    }
  }, [investableTokens, userTokens, fromToken, toToken]);

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
  // For fund swaps with external tokens, check if we have the essential data
  // Only check price loading for selected tokens, not all tokens
  const isDataReady = externalInvestableTokens
    ? !investableTokensError && investableTokens.length > 0 && userTokens.length > 0
    : !effectiveIsLoadingInvestableTokens && !investableTokensError;

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

  // Calculate actual output amount using dynamic prices
  const outputAmount = useMemo(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromTokenPrice || !toTokenPrice) {
      return "0";
    }
    
    const inputAmount = parseFloat(fromAmount);
    const exchangeRate = fromTokenPrice / toTokenPrice;
    const outputValue = inputAmount * exchangeRate;
    
    return outputValue.toFixed(Math.min(5, getTokenDecimalsUtil(toToken)));
  }, [fromAmount, fromTokenPrice, toTokenPrice, getTokenDecimalsUtil, toToken]);


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

    // Challenge-specific validation can be added here if needed

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
      
      // Create contract instance for challenge swap
      const contractAddress = getSteleContractAddress(subgraphNetwork);
      const contractABI = SteleABI.abi;
      
      const steleContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      // Get token addresses
      const fromTokenAddress = getTokenAddressUtil(fromToken);
      const toTokenAddress = getTokenAddressUtil(toToken);

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Could not find token addresses. From: ${fromToken} (${fromTokenAddress}), To: ${toToken} (${toTokenAddress}). Please make sure the tokens are supported.`);
      }

      // Validate token addresses (must be valid Ethereum addresses)
      if (!ethers.isAddress(fromTokenAddress) || !ethers.isAddress(toTokenAddress)) {
        throw new Error(`Invalid token addresses. From: ${fromTokenAddress}, To: ${toTokenAddress}`);
      }

      // Convert amount to wei format based on token decimals
      const fromTokenDecimals = getTokenDecimalsUtil(fromToken);
      const toTokenDecimals = getTokenDecimalsUtil(toToken);
      
      // Validate decimals
      if (!fromTokenDecimals || isNaN(Number(fromTokenDecimals)) || Number(fromTokenDecimals) < 0 || Number(fromTokenDecimals) > 77) {
        throw new Error(`Invalid fromToken decimals: ${fromTokenDecimals}`);
      }
      
      if (!toTokenDecimals || isNaN(Number(toTokenDecimals)) || Number(toTokenDecimals) < 0 || Number(toTokenDecimals) > 77) {
        throw new Error(`Invalid toToken decimals: ${toTokenDecimals}`);
      }
      
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
        if (decimalPlaces > Number(fromTokenDecimals)) {
          // Trim if more decimal places than token decimals
          adjustedAmount = numericAmount.toFixed(Number(fromTokenDecimals));
        }
      }
      
      const amountInWei = ethers.parseUnits(adjustedAmount, Number(fromTokenDecimals));
      
      // Execute challenge swap
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
            getSwapAmountUSD={() => 
              getSwapAmountUSD(outputAmount, toToken, priceData, toTokenPrice || undefined)
            }
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
            fromTokenPrice={fromTokenPrice || undefined}
            toTokenPrice={toTokenPrice || undefined}
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
