import { useQuery } from '@tanstack/react-query';
import { GraphQLClient, gql } from 'graphql-request';
import { NETWORK_SUBGRAPHS } from '@/lib/constants';

const GET_FUND_SETTINGS = gql`
  query GetFundSettings {
    settings(first: 1) {
      id
      managerFee
      maxSlippage
      maxTokens
      owner
    }
  }
`;

export interface FundSettings {
  id: string;
  managerFee: string;
  maxSlippage: string;
  maxTokens: string;
  owner: string;
}

interface FundSettingsResponse {
  settings: FundSettings[];
}

export function useFundSettings(network: 'ethereum' | 'arbitrum') {
  // Get the fund subgraph URL for the network
  const subgraphUrl = network === 'arbitrum' 
    ? NETWORK_SUBGRAPHS.arbitrum_fund 
    : NETWORK_SUBGRAPHS.ethereum_fund;

  return useQuery<FundSettings | null>({
    queryKey: ['fundSettings', network],
    queryFn: async () => {
      if (!subgraphUrl) {
        console.warn(`No fund subgraph URL for network: ${network}`);
        return null;
      }

      try {
        const client = new GraphQLClient(subgraphUrl);
        const data = await client.request<FundSettingsResponse>(GET_FUND_SETTINGS);
        
        if (data && data.settings && data.settings.length > 0) {
          return data.settings[0];
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching fund settings:', error);
        return null;
      }
    },
    // Cache for 1 hour
    staleTime: 60 * 60 * 1000, // 1 hour in milliseconds
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    retry: 2,
  });
}

// Helper function to convert basis points to decimal
export function basisPointsToDecimal(basisPoints: string | number): number {
  const bp = typeof basisPoints === 'string' ? parseInt(basisPoints) : basisPoints;
  return bp / 10000;
}

// Helper function to calculate minimum output with slippage
export function calculateMinOutputWithSlippage(
  expectedOutput: bigint,
  maxSlippageBasisPoints: string | number
): bigint {
  const slippage = typeof maxSlippageBasisPoints === 'string' 
    ? BigInt(maxSlippageBasisPoints) 
    : BigInt(maxSlippageBasisPoints);
  
  const basisPoints = BigInt(10000);
  
  // Use the full maxSlippage value from settings
  // If maxSlippage is 100 basis points (1%), use the full 1%
  // minOutput = expectedOutput * (10000 - maxSlippage) / 10000
  return (expectedOutput * (basisPoints - slippage)) / basisPoints;
}