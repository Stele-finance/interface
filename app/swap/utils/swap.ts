import { ethers } from "ethers"
import { UserTokenInfo } from "@/app/hooks/useUserTokens"
import { SwapQuote, PriceData } from "../components/types"
import { getFromTokenBalance, getFormattedBalanceNumber } from "./token"

// Minimum swap amount in USD (greater than or equal to)
export const MINIMUM_SWAP_USD = 10.0;

// Calculate swap quote using Uniswap V3 pricing data
export const calculateUniswapSwapQuote = (
  fromTokenSymbol: string,
  toTokenSymbol: string,
  fromAmountValue: number,
  uniswapPriceData: PriceData | null
): SwapQuote | null => {
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

// Helper function to check if input amount exceeds available balance
export const isAmountExceedsBalance = (
  fromAmount: string,
  fromToken: string,
  userTokens: UserTokenInfo[]
): boolean => {
  if (!fromAmount || !fromToken || parseFloat(fromAmount) <= 0) return false;
  
  const rawBalance = getFromTokenBalance(fromToken, userTokens);
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
export const isBelowMinimumSwapAmount = (
  fromAmount: string,
  fromToken: string,
  priceData: PriceData | null,
  fromTokenPrice?: number
): boolean => {
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
export const getSwapAmountUSD = (
  fromAmount: string,
  fromToken: string,
  priceData: PriceData | null,
  fromTokenPrice?: number
): number => {
  if (!fromAmount || !fromToken || parseFloat(fromAmount) <= 0) return 0;
  
  // Priority: 1. Dynamic token price 2. Static price data 3. Zero
  const tokenPrice = fromTokenPrice || priceData?.tokens?.[fromToken]?.priceUSD;
  if (!tokenPrice) return 0;
  
  return parseFloat(fromAmount) * tokenPrice;
};

// Handle percentage button click
export const handlePercentageClick = (
  percentage: number,
  fromToken: string,
  userTokens: UserTokenInfo[],
  getTokenDecimals: (symbol: string) => number,
  setFromAmount: (amount: string) => void
) => {
  if (!fromToken) return;
  
  const balance = getFormattedBalanceNumber(fromToken, userTokens);
  if (balance <= 0) return;
  
  const amount = balance * (percentage / 100);
  const tokenDecimals = getTokenDecimals(fromToken);
  
  // Adjust to token decimals
  const adjustedAmount = parseFloat(amount.toFixed(tokenDecimals));
  setFromAmount(adjustedAmount.toString());
};

// Get the reason why data is not ready
export const getDisabledReason = (
  isLoading: boolean,
  error: any,
  priceData: PriceData | null,
  isLoadingInvestableTokens: boolean,
  investableTokensError: any,
  fromToken: string,
  toToken: string,
  hasFromTokenData: boolean,
  hasToTokenData: boolean
): string => {
  if (isLoading) return "Loading price data...";
  if (error) return "Failed to load price data";
  if (!priceData) return "No price data available";
  if (isLoadingInvestableTokens) return "Loading investable tokens...";
  if (investableTokensError) return "Failed to load investable tokens";
  if (fromToken && !hasFromTokenData) return `Price data not available for ${fromToken}`;
  if (toToken && !hasToTokenData) return `Price data not available for ${toToken}`;
  return "";
};

// Calculate output amount
export const calculateOutputAmount = (
  fromAmount: string,
  swapQuote: SwapQuote | null,
  simpleSwapQuote: any,
  getTokenDecimals: (symbol: string) => number,
  toToken: string
): string => {
  const outputAmount = fromAmount && parseFloat(fromAmount) > 0 
    ? (swapQuote 
        ? (parseFloat(fromAmount) * swapQuote.exchangeRate).toFixed(Math.min(5, getTokenDecimals(toToken)))
        : (simpleSwapQuote 
            ? simpleSwapQuote.toAmount.toFixed(Math.min(5, getTokenDecimals(toToken)))
            : "0"))
    : "0";
  
  return outputAmount;
}; 