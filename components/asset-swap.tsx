"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDown, Loader2, ChevronDown, Check } from "lucide-react"
import { HTMLAttributes, useState, useEffect } from "react"
import { cn, getTokenLogo } from "@/lib/utils"
import { useSwapTokenPricesIndependent } from "@/app/hooks/useUniswapBatchPrices"
import { UserTokenInfo } from "@/app/hooks/useUserTokens"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { getSteleContractAddress, getChainId, getChainConfig, buildTransactionUrl, getExplorerName } from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useParams } from "next/navigation"
import { useInvestableTokensForSwap, getTokenAddressBySymbol, getTokenDecimalsBySymbol } from "@/app/hooks/useInvestableTokens"
import { ethers } from "ethers"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useWallet } from "@/app/hooks/useWallet"

interface AssetSwapProps extends HTMLAttributes<HTMLDivElement> {
  userTokens?: UserTokenInfo[];
}

export function AssetSwap({ className, userTokens = [], ...props }: AssetSwapProps) {
  const { t } = useLanguage()
  const { walletType, network, getProvider, isConnected } = useWallet()
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
  
  const { tokens: investableTokens, isLoading: isLoadingInvestableTokens, error: investableTokensError } = useInvestableTokensForSwap(subgraphNetwork);
  const [fromAmount, setFromAmount] = useState<string>("")
  const [fromToken, setFromToken] = useState<string>("")
  const [toToken, setToToken] = useState<string>("WETH")
  const [isSwapping, setIsSwapping] = useState(false)
  const [isHoveringFromToken, setIsHoveringFromToken] = useState(false)
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false)
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false)

  // Minimum swap amount in USD (greater than or equal to)
  const MINIMUM_SWAP_USD = 10.0;

  // Get challengeId from URL params for contract call
  const params = useParams()
  const challengeId = params?.id || params?.challengeId || "1"



  // Get token address by symbol - enhanced with investable tokens
  const getTokenAddress = (tokenSymbol: string): string => {
    // First check user tokens (for from token)
    if (userTokens.length > 0) {
      const userToken = userTokens.find(token => token.symbol === tokenSymbol);
      if (userToken?.address) return userToken.address;
    }
    
    // Then check investable tokens (for to token)
    const investableTokenAddress = getTokenAddressBySymbol(investableTokens, tokenSymbol);
    if (investableTokenAddress) return investableTokenAddress;
    
    // Fallback for common tokens - use ethers.getAddress to ensure proper checksum
    const tokenAddresses: Record<string, string> = {
      'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Ethereum USDC
      'ETH': '0xc02aaa39b223fe8c0a0e5c4f27ead9083c756cc2', // Ethereum WETH (ETH maps to WETH)
      'WETH': '0xc02aaa39b223fe8c0a0e5c4f27ead9083c756cc2', // Ethereum WETH
      'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7', // Ethereum USDT
      'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // Ethereum WBTC
    };
    
    const address = tokenAddresses[tokenSymbol];
    if (address) {
      try {
        return ethers.getAddress(address);
      } catch (error) {
        console.error(`Invalid address for token ${tokenSymbol}: ${address}`, error);
        return '';
      }
    }
    return '';
  };

  // Get token decimals by symbol - enhanced with investable tokens
  const getTokenDecimals = (tokenSymbol: string): number => {
    // First check user tokens (for from token)
    if (userTokens.length > 0) {
      const userToken = userTokens.find(token => token.symbol === tokenSymbol);
      if (userToken?.decimals) return parseInt(userToken.decimals);
    }
    
    // Then check investable tokens (for to token)
    const investableTokenDecimals = getTokenDecimalsBySymbol(investableTokens, tokenSymbol);
    if (investableTokenDecimals !== 18) return investableTokenDecimals; // 18 is default, so if different, use it
    
    // Common token decimals fallback
    const tokenDecimals: Record<string, number> = {
      'USDC': 6,
      'ETH': 18,
      'WETH': 18,
      'BTC': 8,
      'WBTC': 8,
    };
    return tokenDecimals[tokenSymbol] || 18;
  };

  // Use new cached hook to get prices for selected tokens only
  // This replaces the old useSwapTokenPrices to prevent Too Many Requests errors
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
    getTokenAddress,
    getTokenDecimals,
    subgraphNetwork
  );

  // Create compatible priceData structure for existing code
  const priceData = fromTokenPrice && toTokenPrice ? {
    tokens: {
      [fromToken]: { priceUSD: fromTokenPrice },
      [toToken]: { priceUSD: toTokenPrice }
    },
    timestamp: Date.now(),
    source: 'cached'
  } : null;

  // Helper function to format token amounts for display
  const formatTokenAmount = (rawAmount: string, decimals: string): string => {
    try {
      const formatted = ethers.formatUnits(rawAmount, parseInt(decimals))
      const num = parseFloat(formatted)
      
      // Format for better readability without K/M abbreviations
      if (num >= 1) {
        return num.toFixed(4)
      } else {
        return num.toFixed(6)
      }
    } catch (error) {
      return rawAmount // Fallback to raw amount if formatting fails
    }
  }

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.token-dropdown')) {
        setIsFromDropdownOpen(false);
        setIsToDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate swap quote using Uniswap V3 pricing data
  const calculateUniswapSwapQuote = (
    fromTokenSymbol: string,
    toTokenSymbol: string,
    fromAmountValue: number,
    uniswapPriceData: any
  ) => {
    if (!uniswapPriceData || !fromTokenSymbol || !toTokenSymbol || fromAmountValue <= 0) return null;

    const fromPrice = uniswapPriceData.tokens?.[fromTokenSymbol]?.priceUSD;
    const toPrice = uniswapPriceData.tokens?.[toTokenSymbol]?.priceUSD;

    if (!fromPrice || !toPrice) return null;

    // Base exchange rate (without fees and slippage)
    const baseExchangeRate = fromPrice / toPrice;
    
    // Calculate value in USD
    const fromValueUSD = fromAmountValue * fromPrice;
    
    // Simulate DEX price impact based on trade size
    // Larger trades have higher price impact
    const tradeImpactMultiplier = Math.min(fromValueUSD / 10000, 0.05); // Max 5% impact
    const priceImpact = tradeImpactMultiplier * 100;
    
    // Apply price impact to exchange rate
    const impactAdjustedRate = baseExchangeRate * (1 - tradeImpactMultiplier);
    
    // Calculate output amount
    const toAmountBase = fromAmountValue * impactAdjustedRate;
    
    // Protocol fees (0.3% typical for AMM DEXs)
    const protocolFeeRate = 0.003;
    const protocolFee = toAmountBase * protocolFeeRate;
    
    // Final amount after fees
    const toAmountAfterFees = toAmountBase - protocolFee;
    
    // Slippage tolerance (1%)
    const slippageTolerance = 0.01;
    const minimumReceived = toAmountAfterFees * (1 - slippageTolerance);
    
    // Network fees (estimated)
    const networkFee = 2.5; // USD

    return {
      fromToken: fromTokenSymbol,
      toToken: toTokenSymbol,
      fromAmount: fromAmountValue,
      toAmount: toAmountAfterFees,
      exchangeRate: impactAdjustedRate,
      priceImpact,
      minimumReceived,
      fees: {
        network: networkFee,
        protocol: protocolFee * toPrice, // Convert to USD
      }
    };
  };

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

  // Get the reason why data is not ready
  const getDisabledReason = (): string => {
    if (isLoading) return "Loading price data...";
    if (error) return "Failed to load price data";
    if (!priceData) return "No price data available";
    if (isLoadingInvestableTokens) return "Loading investable tokens...";
    if (investableTokensError) return "Failed to load investable tokens";
    if (fromToken && !hasFromTokenData) return `Price data not available for ${fromToken}`;
    if (toToken && !hasToTokenData) return `Price data not available for ${toToken}`;
    return "";
  };

  const disabledReason = getDisabledReason();

  // Helper function to check if input amount exceeds available balance
  const isAmountExceedsBalance = (): boolean => {
    if (!fromAmount || !fromToken || parseFloat(fromAmount) <= 0) return false;
    
    const rawBalance = getFromTokenBalance(fromToken);
    const userToken = userTokens.find(token => token.symbol === fromToken);
    
    if (!userToken || rawBalance === '0') return false;
    
    try {
      let formattedBalance = 0;

      // Smart balance detection
      if (rawBalance.includes('.')) {
        // Already formatted (contains decimal point)
        formattedBalance = parseFloat(rawBalance);
      } else {
        // Check if this looks like a reasonable formatted balance or raw wei amount
        const rawValue = parseFloat(rawBalance);
        const decimals = parseInt(userToken.decimals);
        
        // For USDC (6 decimals), if raw value is reasonable (e.g., 100), 
        // it's likely already formatted. Raw USDC would be much larger (e.g., 100000000)
        if (fromToken === 'USDC' && rawValue < 1000000) {
          // Likely already formatted USDC
          formattedBalance = rawValue;
        } else if (rawValue < Math.pow(10, decimals)) {
          // Value is too small to be raw wei amount, likely already formatted
          formattedBalance = rawValue;
        } else {
          // Raw amount, format it
          formattedBalance = parseFloat(ethers.formatUnits(rawBalance, decimals));
        }
      }
      
      const exceedsBalance = parseFloat(fromAmount) > formattedBalance;      
      return exceedsBalance;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  };

  // Helper function to check if input amount is below minimum swap amount ($10 USD)
  const isBelowMinimumSwapAmount = (): boolean => {
    if (!fromAmount || !fromToken || parseFloat(fromAmount) <= 0) return false;
    
    // Priority: 1. Accurate price data 2. Individual token price 3. Return false to not block
    const tokenPrice = priceData?.tokens?.[fromToken]?.priceUSD || fromTokenPrice;
    if (!tokenPrice) return false;
    
    const usdValue = parseFloat(fromAmount) * tokenPrice;
    
    // Use a small epsilon to handle floating point precision issues
    const epsilon = 0.001; // $0.001 tolerance
    const isBelowMin = usdValue < (MINIMUM_SWAP_USD - epsilon);
    
    return isBelowMin; // Must be $10.00 or higher with tolerance
  };

  // Get USD value of the current input amount
  const getSwapAmountUSD = (): number => {
    if (!fromAmount || !fromToken || parseFloat(fromAmount) <= 0) return 0;
    
    // Priority: 1. Accurate price data 2. Individual token price 3. Zero
    const tokenPrice = priceData?.tokens?.[fromToken]?.priceUSD || fromTokenPrice;
    if (!tokenPrice) return 0;
    
    return parseFloat(fromAmount) * tokenPrice;
  };

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Limit decimal places based on token decimals
      if (value.includes('.') && fromToken) {
        const parts = value.split('.');
        const maxDecimals = getTokenDecimals(fromToken);
        if (parts[1] && parts[1].length > maxDecimals) {
          return; // Don't update if more decimal places than token supports
        }
      }
      setFromAmount(value)
    }
  }

  // Get formatted balance as number for calculations
  const getFormattedBalanceNumber = (tokenSymbol: string): number => {
    if (!tokenSymbol) return 0;
    
    const rawBalance = getFromTokenBalance(tokenSymbol);
    const userToken = userTokens.find(token => token.symbol === tokenSymbol);
    
    if (!userToken || rawBalance === '0') return 0;
    
    try {
      let formattedBalance = 0;

      // Smart balance detection (same logic as isAmountExceedsBalance)
      if (rawBalance.includes('.')) {
        // Already formatted (contains decimal point)
        formattedBalance = parseFloat(rawBalance);
      } else {
        // Check if this looks like a reasonable formatted balance or raw wei amount
        const rawValue = parseFloat(rawBalance);
        const decimals = parseInt(userToken.decimals);
        
        // For USDC (6 decimals), if raw value is reasonable (e.g., 100), 
        // it's likely already formatted. Raw USDC would be much larger (e.g., 100000000)
        if (tokenSymbol === 'USDC' && rawValue < 1000000) {
          // Likely already formatted USDC
          formattedBalance = rawValue;
        } else if (rawValue < Math.pow(10, decimals)) {
          // Value is too small to be raw wei amount, likely already formatted
          formattedBalance = rawValue;
        } else {
          // Raw amount, format it
          formattedBalance = parseFloat(ethers.formatUnits(rawBalance, decimals));
        }
      }
      
      return formattedBalance;
      
    } catch (error) {
      console.error('Error getting formatted balance:', error);
      return 0;
    }
  };

  // Handle percentage button click
  const handlePercentageClick = (percentage: number) => {
    if (!fromToken) return;
    
    const balance = getFormattedBalanceNumber(fromToken);
    if (balance <= 0) return;
    
    const amount = balance * (percentage / 100);
    const tokenDecimals = getTokenDecimals(fromToken);
    
    // Adjust to token decimals
    const adjustedAmount = parseFloat(amount.toFixed(tokenDecimals));
    setFromAmount(adjustedAmount.toString());
  }

  // Get available tokens
  const availableFromTokens = userTokens.length > 0 ? userTokens.map(token => token.symbol) : (priceData?.tokens ? Object.keys(priceData.tokens) : ['ETH', 'USDC', 'USDT', 'WETH', 'WBTC']);
  const availableToTokens = investableTokens.length > 0 
    ? investableTokens.map(token => token.symbol).filter(symbol => symbol !== fromToken)
    : ['WETH', 'USDC', 'ETH', 'USDT', 'WBTC'].filter(symbol => symbol !== fromToken); // Default tokens if investable tokens not loaded

  // Get balance for fromToken (raw amount)
  const getFromTokenBalance = (tokenSymbol: string): string => {
    if (userTokens.length > 0) {
      const userToken = userTokens.find(token => token.symbol === tokenSymbol);
      return userToken?.amount || '0';
    }
    return '0'; // Default balance if no user tokens
  };

  // Get formatted balance for display
  const getFormattedTokenBalance = (tokenSymbol: string): string => {
    if (userTokens.length > 0) {
      const userToken = userTokens.find(token => token.symbol === tokenSymbol);
      if (userToken) {
        return userToken.amount;
      }
    }
    return '0'; // Default balance if no user tokens
  };

  const handleTokenSwap = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

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
    if (isAmountExceedsBalance()) {
      const rawBalance = getFromTokenBalance(fromToken);
      const userToken = userTokens.find(token => token.symbol === fromToken);
      
      let formattedBalance = 0;
      try {
        if (rawBalance.includes('.')) {
          formattedBalance = parseFloat(rawBalance);
        } else if (userToken) {
          const rawValue = parseFloat(rawBalance);
          const decimals = parseInt(userToken.decimals);
          
          // Use same smart detection logic
          if (fromToken === 'USDC' && rawValue < 1000000) {
            formattedBalance = rawValue;
          } else if (rawValue < Math.pow(10, decimals)) {
            formattedBalance = rawValue;
          } else {
            formattedBalance = parseFloat(ethers.formatUnits(rawBalance, decimals));
          }
        } else {
          formattedBalance = parseFloat(rawBalance);
        }
      } catch (error) {
        console.error('Error formatting balance for toast:', error);
        formattedBalance = parseFloat(rawBalance);
      }
      
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken}. Available: ${formattedBalance.toFixed(6)}`,
      });
      return;
    }

    // Check if wallet is connected
    if (!isConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsSwapping(true);

    try {
      // Dynamic import of ethers to avoid SSR issues
      const { ethers } = await import('ethers');

      // Get provider using useWallet hook
      const browserProvider = getProvider();
      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
        }
        
      // Use BrowserProvider's send method for RPC requests
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

      // Check if we are on correct network
      const chainId = await browserProvider.send('eth_chainId', []);

      // Filter network to supported types for contracts (exclude 'solana')
      const contractNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum';
      const targetChainId = getChainId(contractNetwork);
      if (chainId !== targetChainId) {
        // Switch to target network
        try {
          await browserProvider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await browserProvider.send('wallet_addEthereumChain', [getChainConfig(contractNetwork)]);
          } else {
            throw switchError;
          }
        }
      }

      // Use existing browserProvider and get signer
      const signer = await browserProvider.getSigner();
      
      // Create contract instance
      const steleContract = new ethers.Contract(
        getSteleContractAddress(contractNetwork),
        SteleABI.abi,
        signer
      );

      // Get token addresses
      const fromTokenAddress = getTokenAddress(fromToken);
      const toTokenAddress = getTokenAddress(toToken);

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Could not find token addresses. From: ${fromToken} (${fromTokenAddress}), To: ${toToken} (${toTokenAddress}). Please make sure the tokens are supported.`);
      }

      // Convert amount to wei format based on token decimals
      const fromTokenDecimals = getTokenDecimals(fromToken);
      
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
      const explorerName = getExplorerName(network);
      const submittedTxUrl = buildTransactionUrl(network, tx.hash);
      
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
        const confirmedTxUrl = buildTransactionUrl(network, receipt.hash);
        
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
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled";
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

  // Calculate actual output amount based on user input
  // Priority: 1. Accurate Uniswap quote 2. Simple estimate 3. Zero
  const outputAmount = fromAmount && parseFloat(fromAmount) > 0 
    ? (swapQuote 
        ? (parseFloat(fromAmount) * swapQuote.exchangeRate).toFixed(Math.min(6, getTokenDecimals(toToken)))
        : (simpleSwapQuote 
            ? simpleSwapQuote.toAmount.toFixed(Math.min(6, getTokenDecimals(toToken)))
            : "0"))
    : "0";
  
  // Show if using basic estimate
  const isUsingBasicEstimate = !swapQuote && simpleSwapQuote;

  // Remove loading and error states - show swap interface immediately

  return (
    <div className={cn("max-w-md mx-auto", className)} {...props}>
      <Card className="bg-transparent border-0">
        <CardContent className="p-0 space-y-3">
          {/* From Token */}
          <div className="space-y-2">
            <div 
              className="p-4 bg-transparent border border-gray-600 rounded-2xl relative"
              onMouseEnter={() => setIsHoveringFromToken(true)}
              onMouseLeave={() => setIsHoveringFromToken(false)}
            >
                              <div className="text-sm text-gray-400 mb-3">{t('sell')}</div>
              <div className="flex items-center justify-between min-h-[60px]">
                <div className="flex-1 min-w-0 pr-4">
                  <Input
                    placeholder="0"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    className={`bg-transparent border-0 p-1 h-12 focus-visible:ring-0 w-full overflow-hidden text-ellipsis rounded-none outline-none ${
                      fromAmount && (isBelowMinimumSwapAmount() || isAmountExceedsBalance()) 
                        ? 'text-red-400' 
                        : 'text-white'
                    }`}
                    style={{ 
                      fontSize: fromAmount && fromAmount.length > 15 ? '1.25rem' : 
                               fromAmount && fromAmount.length > 12 ? '1.5rem' : '1.75rem', 
                      lineHeight: '1',
                      boxShadow: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                  <div className="text-sm text-gray-400 mt-1">
                    ${getSwapAmountUSD().toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 relative">
                  {/* Percentage Badges - Show on hover */}
                  {isHoveringFromToken && fromToken && getFormattedTokenBalance(fromToken) !== '0' && (
                    <div className="absolute -top-10 right-0 flex gap-1 z-10">
                      <Button
                        onClick={() => handlePercentageClick(25)}
                        className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                        size="sm"
                      >
                        25%
                      </Button>
                      <Button
                        onClick={() => handlePercentageClick(50)}
                        className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                        size="sm"
                      >
                        50%
                      </Button>
                      <Button
                        onClick={() => handlePercentageClick(75)}
                        className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                        size="sm"
                      >
                        75%
                      </Button>
                      <Button
                        onClick={() => handlePercentageClick(100)}
                        className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                        size="sm"
                      >
                        Max
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-col items-end relative">
                    <div className="relative token-dropdown">
                      <Button
                        variant="ghost"
                        onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                        className="bg-transparent hover:bg-muted/60 border border-gray-600 text-white rounded-full px-4 py-2 text-sm font-medium h-auto gap-2 transition-all duration-200 min-w-[120px] justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {fromToken ? (
                            <>
                              <Image
                                src={getTokenLogo(getTokenAddress(fromToken), subgraphNetwork) || `/tokens/small/${fromToken.toLowerCase()}.png`}
                                alt={fromToken}
                                width={20}
                                height={20}
                                className="rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const avatar = target.nextElementSibling as HTMLElement
                                  if (avatar) avatar.style.display = 'flex'
                                }}
                              />
                              <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                                <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                                  {fromToken.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{fromToken}</span>
                            </>
                          ) : (
                            <span>{t('select')}</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      
                      {isFromDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-muted/80 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {!fromToken && (
                            <div
                              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 cursor-pointer text-gray-400 text-sm"
                              onClick={() => {
                                setFromToken("")
                                setIsFromDropdownOpen(false)
                      }}
                    >
                              <span>{t('select')}</span>
                            </div>
                          )}
                      {availableFromTokens.map((token) => (
                            <div
                              key={token}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 cursor-pointer text-white text-sm"
                              onClick={() => {
                                setFromToken(token)
                                setIsFromDropdownOpen(false)
                              }}
                            >
                              <Image
                                src={getTokenLogo(getTokenAddress(token), subgraphNetwork) || `/tokens/small/${token.toLowerCase()}.png`}
                                alt={token}
                                width={20}
                                height={20}
                                className="rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const avatar = target.nextElementSibling as HTMLElement
                                  if (avatar) avatar.style.display = 'flex'
                                }}
                              />
                              <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                                <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                                  {token.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{token}</span>
                              {fromToken === token && <Check className="h-4 w-4 ml-auto" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs mt-1 ${
                      fromAmount && isAmountExceedsBalance() 
                        ? 'text-red-400' 
                        : 'text-gray-400'
                    }`}>
                      {getFormattedTokenBalance(fromToken)} {fromToken}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          <div className="space-y-2">
            <div className="p-4 bg-transparent border border-gray-600 rounded-2xl">
                              <div className="text-sm text-gray-400 mb-3">{t('buy')}</div>
              <div className="flex items-center justify-between min-h-[60px]">
                <div className="flex-1 min-w-0 pr-4">
                  <div 
                    className="text-white overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ 
                      fontSize: outputAmount && outputAmount.length > 15 ? '1.25rem' : 
                               outputAmount && outputAmount.length > 12 ? '1.5rem' : '1.75rem'
                    }}
                  >
                    {(() => {
                      if (!outputAmount || outputAmount === "0") return "0";
                      const num = parseFloat(outputAmount);
                      if (num % 1 === 0) return num.toString();
                      return num.toFixed(Math.min(4, getTokenDecimals(toToken))).replace(/\.?0+$/, '');
                    })()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${outputAmount && toToken && (priceData?.tokens?.[toToken] || toTokenPrice) ? 
                      (parseFloat(outputAmount) * (priceData?.tokens?.[toToken]?.priceUSD || toTokenPrice || 0)).toFixed(2) : "0.00"}
                    {isUsingBasicEstimate && (
                      <span className="text-orange-400 ml-1">({t('loadingPrice')})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 relative">
                  <div className="relative token-dropdown">
                    <Button
                      variant="ghost"
                      onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                      className="bg-transparent hover:bg-muted/60 border border-gray-600 text-white rounded-full px-4 py-2 text-sm font-medium h-auto gap-2 transition-all duration-200 min-w-[120px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {toToken ? (
                          <>
                            <Image
                              src={getTokenLogo(getTokenAddress(toToken), subgraphNetwork) || `/tokens/small/${toToken.toLowerCase()}.png`}
                              alt={toToken}
                              width={20}
                              height={20}
                              className="rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const avatar = target.nextElementSibling as HTMLElement
                                if (avatar) avatar.style.display = 'flex'
                              }}
                            />
                            <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                              <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                                {toToken.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{toToken}</span>
                          </>
                        ) : (
                          <span>{t('select')}</span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    
                    {isToDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-muted/80 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {availableToTokens.map((token) => (
                          <div
                            key={token}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 cursor-pointer text-white text-sm"
                            onClick={() => {
                              setToToken(token)
                              setIsToDropdownOpen(false)
                            }}
                          >
                            <Image
                              src={getTokenLogo(getTokenAddress(token), subgraphNetwork) || `/tokens/small/${token.toLowerCase()}.png`}
                              alt={token}
                              width={20}
                              height={20}
                              className="rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const avatar = target.nextElementSibling as HTMLElement
                                if (avatar) avatar.style.display = 'flex'
                              }}
                            />
                            <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                              <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                                {token.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{token}</span>
                            {toToken === token && <Check className="h-4 w-4 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate - Simple Display */}
          {isDataReady && fromToken && toToken && (swapQuote || simpleSwapQuote) && (
            <div className="text-center text-sm text-gray-400">
              1 {fromToken} = {(swapQuote ? swapQuote.exchangeRate : simpleSwapQuote?.exchangeRate || 0).toFixed(Math.min(6, getTokenDecimals(toToken)))} {toToken}
              {isUsingBasicEstimate && (
                <span className="text-orange-400 ml-1">({t('loadingPrice')})</span>
              )}
            </div>
          )}
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white font-semibold h-14 rounded-2xl mt-4 border-orange-500 hover:border-orange-600 disabled:border-orange-500/50" 
            size="lg"
            onClick={handleSwapTransaction}
            disabled={(() => {
              const conditions = {
                noFromAmount: !fromAmount,
                invalidAmount: parseFloat(fromAmount) <= 0,
                noFromToken: !fromToken,
                noToToken: !toToken,
                dataNotReady: !isDataReady,
                isSwapping: isSwapping,
                exceedsBalance: isAmountExceedsBalance(),
                belowMinimum: isBelowMinimumSwapAmount()
              };
              
              const isDisabled = Object.values(conditions).some(condition => condition);  
              return isDisabled;
            })()}
          >
            {isSwapping ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('swapping')}
              </div>
            ) : !isDataReady ? (
              t('loadingData')
            ) : !fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken ? (
              t('enterAmount')
            ) : isAmountExceedsBalance() ? (
              t('insufficientBalance')
            ) : isBelowMinimumSwapAmount() ? (
              t('minimumAmountRequired')
            ) : (
              t('swap')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
