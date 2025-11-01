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
import { useQueryClient } from "@tanstack/react-query"
// Challenge hooks not needed for fund swaps
import { useFundInvestableTokensForSwap } from "@/app/hooks/useFundInvestableTokens"
import { useFundSettings } from "@/app/hooks/useFundSettings"
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
  getSteleFundContractAddress,
  getChainId,
  getChainConfig,
  buildTransactionUrl,
  getExplorerName
} from "@/lib/constants"
// Challenge ABI not needed for fund swaps
import SteleFundABI from "@/app/abis/SteleFund.json"

export function FundAssetSwap({ className, userTokens = [], investableTokens: externalInvestableTokens, onSwappingStateChange, ...props }: AssetSwapProps) {
  const { t } = useLanguage()
  const { walletType, getProvider, isConnected } = useWallet()
  const queryClient = useQueryClient()
  
  // Get network from URL path instead of wallet
  const pathParts = window.location.pathname.split('/');
  const networkFromUrl = pathParts.find(part => part === 'ethereum' || part === 'arbitrum') || 'ethereum';
  const subgraphNetwork = networkFromUrl as 'ethereum' | 'arbitrum';
  
  // This is always a fund swap
  const isFundSwap = true;
  
  // Use external investableTokens if provided, otherwise fetch from subgraph
  const { tokens: fundTokens, isLoading: isLoadingFundTokens, error: fundTokensError } = useFundInvestableTokensForSwap(subgraphNetwork);

  const fetchedInvestableTokens = fundTokens;
  const isLoadingInvestableTokens = isLoadingFundTokens;
  const investableTokensError = fundTokensError;

  const investableTokens = externalInvestableTokens || fetchedInvestableTokens;
  
  // If externalInvestableTokens are provided, we're not loading from the hook
  const effectiveIsLoadingInvestableTokens = externalInvestableTokens ? false : isLoadingInvestableTokens;
  
  // Fetch fund settings for slippage configuration
  const { data: fundSettings, isLoading: isLoadingSettings } = useFundSettings(subgraphNetwork);
  const [fromAmount, setFromAmount] = useState<string>("")
  const [fromToken, setFromToken] = useState<string>("")
  const [toToken, setToToken] = useState<string>("")
  const [isSwapping, setIsSwapping] = useState(false)
  
  // Notify parent component when swapping state changes
  useEffect(() => {
    onSwappingStateChange?.(isSwapping);
  }, [isSwapping, onSwappingStateChange]);

  // Get fundId from URL params for contract call
  const params = useParams()
  const fundId = params?.id || "1"

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
    ? investableTokens.length > 0 && userTokens.length > 0  // External tokens are already loaded
    : !effectiveIsLoadingInvestableTokens && !investableTokensError && investableTokens.length > 0 && userTokens.length > 0;

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
      return;
    }

    if (parseFloat(fromAmount) <= 0) {
      return;
    }

    // Check if user has sufficient balance - use same logic as isAmountExceedsBalance
    if (isAmountExceedsBalanceUtil()) {
      return;
    }

    // Fund-specific validation
    const userToken = userTokens.find(token => token.symbol === fromToken);

    if (!userToken) {
      return;
    }

    const availableAmount = parseFloat(userToken.amount || "0");
    const requestedAmount = parseFloat(fromAmount);

    if (availableAmount < requestedAmount) {
      return;
    }

    // Check if wallet is connected
    if (!isConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsSwapping(true);

    try {
      // Get provider using useWallet hook
      const browserProvider = await getProvider();
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
      
      // Create contract instance for fund swap
      const contractAddress = getSteleFundContractAddress(subgraphNetwork);
      const contractABI = SteleFundABI.abi;
      
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
      
      // Execute fund swap with slippage protection
      let tx;
      {
        let minOutputAmount = BigInt(0);
        
        if (outputAmount && parseFloat(outputAmount) > 0 && fundSettings?.maxSlippage) {
          const expectedOutput = ethers.parseUnits(outputAmount, Number(toTokenDecimals));
          
          // Use maxSlippage but reduce it by 20% for more conservative calculation
          const maxSlippageBP = parseInt(fundSettings.maxSlippage);
          const reducedSlippage = Math.floor(maxSlippageBP * 0.8); // 20% reduction
                    
          // Calculate minOutput = expectedOutput * (10000 - reducedSlippage) / 10000
          const basisPoints = BigInt(10000);
          const slippageBigInt = BigInt(reducedSlippage);
          minOutputAmount = (expectedOutput * (basisPoints - slippageBigInt)) / basisPoints;          
        } else if (outputAmount && parseFloat(outputAmount) > 0) {
          // Fallback: use 1% slippage if settings not available
          const expectedOutput = ethers.parseUnits(outputAmount, Number(toTokenDecimals));
          minOutputAmount = (expectedOutput * BigInt(9900)) / BigInt(10000);
          console.warn('Fund settings not available, using 1% slippage fallback');
        } else {
          console.warn('No outputAmount available, using minimal value');
          minOutputAmount = BigInt(1);
        }
        
        // If still 0, something went wrong - set a minimal amount to avoid reverting with 0
        if (minOutputAmount === BigInt(0)) {
          console.warn('Could not calculate minimum output, using minimal amount');
          minOutputAmount = BigInt(1);
        }

        // Find best swap path using Uniswap Smart Order Router (V3 only)
        console.log('Finding best swap path...');
        const { findBestSwapPath } = await import('../utils/pathFinder');
        const bestPath = await findBestSwapPath(
          fromTokenAddress,
          toTokenAddress,
          amountInWei,
          subgraphNetwork,
          Number(fromTokenDecimals),
          Number(toTokenDecimals),
          fromToken,
          toToken
        );

        if (!bestPath) {
          throw new Error('No valid swap path found. The pool may not exist or have insufficient liquidity.');
        }

        console.log(`Best path found: ${bestPath.swapType === 0 ? 'Single-hop' : 'Multi-hop'}`);
        console.log(`Expected output: ${ethers.formatUnits(bestPath.amountOut, Number(toTokenDecimals))} ${toToken}`);

        // Recalculate minOutputAmount based on router's quote
        minOutputAmount = bestPath.amountOut;
        if (fundSettings?.maxSlippage) {
          const maxSlippageBP = parseInt(fundSettings.maxSlippage);
          const reducedSlippage = Math.floor(maxSlippageBP * 0.8);
          minOutputAmount = (bestPath.amountOut * (BigInt(10000) - BigInt(reducedSlippage))) / BigInt(10000);
        } else {
          minOutputAmount = (bestPath.amountOut * BigInt(9900)) / BigInt(10000);
        }
        if (minOutputAmount === BigInt(0)) minOutputAmount = BigInt(1);

        // Prepare swap params using best path found
        const swapParams = {
          swapType: bestPath.swapType, // 0 = single-hop, 1 = multi-hop
          tokenIn: fromTokenAddress,
          tokenOut: toTokenAddress,
          path: bestPath.path, // Encoded path for multi-hop, "0x" for single-hop
          fee: bestPath.fee, // Fee tier for single-hop
          amountIn: amountInWei,
          amountOutMinimum: minOutputAmount
        };
    
        // Estimate gas first
        let gasEstimate;
        try {
          gasEstimate = await steleContract.swap.estimateGas(
            fundId,
            [swapParams]
          );
          // Add 20% buffer to gas estimate
          gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100);
        } catch (estimateError: any) {
          console.warn("Gas estimation failed, using default:", estimateError);
          
          // Check for specific contract errors
          if (estimateError.reason) {
            const errorReason = estimateError.reason;
            let errorMessage = "Swap failed";
            
            switch (errorReason) {
              case "ESP":
                errorMessage = "Insufficient liquidity or slippage too low. Try increasing slippage.";
                break;
              case "STF":
                errorMessage = "Token transfer failed. Check token allowances.";
                break;
              case "TF":
                errorMessage = "Transaction failed. Insufficient balance or allowance.";
                break;
              case "IS":
                errorMessage = "Invalid swap parameters.";
                break;
              default:
                errorMessage = `Swap estimation failed: ${errorReason}`;
            }
            
            throw new Error(errorMessage);
          }
          
          gasEstimate = BigInt(500000); // Fallback gas limit
        }
    
        tx = await steleContract.swap(
          fundId,
          [swapParams],
          {
            gasLimit: gasEstimate
          }
        );
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Clear the form
      setFromAmount("");

      // Invalidate queries to refresh data after successful swap
      setTimeout(() => {
        // Fund data
        queryClient.invalidateQueries({ queryKey: ['fund', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork] });

        // Investor data
        queryClient.invalidateQueries({ queryKey: ['fundInvestor', subgraphNetwork] });

        // Transactions
        queryClient.invalidateQueries({ queryKey: ['fundTransactions', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundAllTransactions', fundId, subgraphNetwork] });

        // Snapshots for charts
        queryClient.invalidateQueries({ queryKey: ['fundSnapshots', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestorSnapshots', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['investorSnapshots', fundId, subgraphNetwork] });

        // Share data
        queryClient.invalidateQueries({ queryKey: ['fundShare', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['investorShare', subgraphNetwork] });
      }, 3000);

    } catch (error: any) {
      console.error("Swap error:", error);
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
