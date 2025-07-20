import { ethers } from "ethers"
import { UserTokenInfo } from "@/app/hooks/useUserTokens"
import { getTokenAddressBySymbol, getTokenDecimalsBySymbol } from "@/app/hooks/useInvestableTokens"

// Get token address by symbol - enhanced with investable tokens
export const getTokenAddress = (
  tokenSymbol: string, 
  userTokens: UserTokenInfo[], 
  investableTokens: any[]
): string => {
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
export const getTokenDecimals = (
  tokenSymbol: string, 
  userTokens: UserTokenInfo[], 
  investableTokens: any[]
): number => {
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

// Helper function to format token amounts for display
export const formatTokenAmount = (rawAmount: string, decimals: string): string => {
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

// Get balance for fromToken (raw amount)
export const getFromTokenBalance = (tokenSymbol: string, userTokens: UserTokenInfo[]): string => {
  if (userTokens.length > 0) {
    const userToken = userTokens.find(token => token.symbol === tokenSymbol);
    return userToken?.amount || '0';
  }
  return '0'; // Default balance if no user tokens
};

// Get formatted balance for display
export const getFormattedTokenBalance = (tokenSymbol: string, userTokens: UserTokenInfo[]): string => {
  if (userTokens.length > 0) {
    const userToken = userTokens.find(token => token.symbol === tokenSymbol);
    if (userToken) {
      return userToken.amount;
    }
  }
  return '0'; // Default balance if no user tokens
};

// Get formatted balance as number for calculations
export const getFormattedBalanceNumber = (
  tokenSymbol: string, 
  userTokens: UserTokenInfo[]
): number => {
  if (!tokenSymbol) return 0;
  
  const rawBalance = getFromTokenBalance(tokenSymbol, userTokens);
  const userToken = userTokens.find(token => token.symbol === tokenSymbol);
  
  if (!userToken || rawBalance === '0') return 0;
  
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

// Get available tokens lists
export const getAvailableTokens = (
  userTokens: UserTokenInfo[], 
  investableTokens: any[], 
  priceData: any, 
  fromToken?: string
) => {
  const availableFromTokens = userTokens.length > 0 
    ? userTokens.map(token => token.symbol) 
    : (priceData?.tokens ? Object.keys(priceData.tokens) : ['ETH', 'USDC', 'USDT', 'WETH', 'WBTC']);
    
  const availableToTokens = investableTokens.length > 0 
    ? investableTokens.map(token => token.symbol).filter(symbol => symbol !== fromToken)
    : ['WETH', 'USDC', 'ETH', 'USDT', 'WBTC'].filter(symbol => symbol !== fromToken);

  return { availableFromTokens, availableToTokens };
}; 