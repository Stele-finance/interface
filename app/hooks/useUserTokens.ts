"use client"

import { useQuery } from "@tanstack/react-query";
import { useInvestorData } from "./useChallengeInvestorData";

export interface UserTokenInfo {
  address: string;
  symbol: string;
  amount: string;
  decimals: string;
}

export function useUserTokens(challengeId: string, walletAddress: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  // Get investor data
  const { data: investorData, isLoading: isLoadingInvestor, error: investorError } = useInvestorData(
    challengeId, 
    walletAddress,
    network
  );

  // Process and cache the token data
  return useQuery<UserTokenInfo[]>({
    queryKey: ['userTokens', challengeId, walletAddress, network],
    queryFn: () => {
      if (!investorData?.investor) {
        return [];
      }

      const investor = investorData.investor;
      const tokens = investor.tokens || [];
      const tokensAmount = investor.tokensAmount || [];
      const tokensSymbols = investor.tokensSymbols || [];
      const tokensDecimals = investor.tokensDecimals || [];

      // Create token info array
      const userTokens: UserTokenInfo[] = tokens.map((address, index) => ({
        address,
        symbol: tokensSymbols[index] || `TOKEN_${index}`,
        amount: tokensAmount[index] || '0',
        decimals: tokensDecimals[index] || '18'
      }));

      return userTokens;
    },
    enabled: !!investorData?.investor,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

// Additional helper hooks for specific use cases
export function useUserTokenBalance(challengeId: string, walletAddress: string, tokenSymbol: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const { data: userTokens } = useUserTokens(challengeId, walletAddress, network);
  
  const token = userTokens?.find(token => token.symbol === tokenSymbol);
  return {
    balance: token?.amount || '0',
    rawAmount: token?.amount || '0',
    decimals: token?.decimals || '18',
    address: token?.address || ''
  };
}

export function useUserTokenBySymbol(challengeId: string, walletAddress: string, tokenSymbol: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const { data: userTokens } = useUserTokens(challengeId, walletAddress, network);
  return userTokens?.find(token => token.symbol === tokenSymbol) || null;
} 