// Arbitrum One Mainnet Information
export const ARBITRUM_CHAIN_ID = '0xa4b1'; // Arbitrum One chain ID (hexadecimal)
export const ARBITRUM_CHAIN_CONFIG = {
  chainId: ARBITRUM_CHAIN_ID,
  chainName: 'Arbitrum',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://arbiscan.io']
};


// Ethereum Mainnet Information
export const ETHEREUM_CHAIN_ID = '0x1'; // Ethereum mainnet chain ID (hexadecimal)
export const ETHEREUM_CHAIN_CONFIG = {
  chainId: ETHEREUM_CHAIN_ID,
  chainName: 'Ethereum Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY],
  blockExplorerUrls: ['https://etherscan.io']
};
export const ETHEREUM_BLOCK_TIME_MS = 12; // ~12 seconds per block
export const ARBITRUM_BLOCK_TIME_MS = 0.25; // ~0.25 seconds per block (250ms)

// Network-specific Contract Addresses
export const NETWORK_CONTRACTS = {
  ethereum_fund: {
    STELE_FUND_CONTRACT_ADDRESS: "0x8a37AC980ceC4c3a4f791147dC1c06983772C3D5",
    STELE_FUND_NFT_ADDRESS: "0xBe2732dfB5e35684234747f3cED88279495749e5",
    STELE_FUND_INFO_ADDRESS: "0x11220097980b4D42b23B97af64842e8cE95b70ac",
    USDC_TOKEN_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    RPC_URL: 'https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://etherscan.io',
    EXPLORER_NAME: 'Etherscan',
    // Uniswap V3 addresses
    UNISWAP_V3_QUOTER: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // QuoterV2
    MULTICALL_CONTRACT: "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
    WETH_TOKEN_ADDRESS: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC_TOKEN_ADDRESS: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    UNI_TOKEN_ADDRESS: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    LINK_TOKEN_ADDRESS: "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  },
  arbitrum_fund: {
    STELE_FUND_CONTRACT_ADDRESS: "0xC252969F84F7C358F46d1E1AcF0b3193B2fdc8Ee",
    STELE_FUND_NFT_ADDRESS: "0x3B69c564263D8c624DD9f5Aa13DF456cc45648dB",
    STELE_FUND_INFO_ADDRESS: "0x51873f786f22Ab55e183a03A7F80fca11cDcC342",
    USDC_TOKEN_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    RPC_URL: 'https://arbitrum-mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://arbiscan.io',
    EXPLORER_NAME: 'Arbiscan',
    // Uniswap V3 addresses (Arbitrum)
    UNISWAP_V3_QUOTER: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // QuoterV2
    MULTICALL_CONTRACT: "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
    WETH_TOKEN_ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // Arbitrum WETH
    WBTC_TOKEN_ADDRESS: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // Arbitrum WBTC
    UNI_TOKEN_ADDRESS: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",   // Arbitrum UNI
    LINK_TOKEN_ADDRESS: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"  // Arbitrum LINK
  }
} as const;

// Helper function to get network-specific block time
export const getBlockTimeSeconds = (network: string): number => {
  switch (network) {
    case 'arbitrum':
      return ARBITRUM_BLOCK_TIME_MS
    case 'ethereum':
    default:
      return ETHEREUM_BLOCK_TIME_MS
  }
}

// Helper function to convert voting period from one network to another
export const convertVotingPeriodToNetwork = (
  votingPeriodBlocks: number,
  fromNetwork: string,
  toNetwork: string
): number => {
  if (fromNetwork === toNetwork) {
    return votingPeriodBlocks
  }

  // Convert to seconds first (assuming the voting period is designed for the source network)
  const fromBlockTime = getBlockTimeSeconds(fromNetwork)
  const totalSeconds = votingPeriodBlocks * fromBlockTime

  // Convert to target network blocks
  const toBlockTime = getBlockTimeSeconds(toNetwork)
  const convertedBlocks = Math.round(totalSeconds / toBlockTime)

  return convertedBlocks
}

// Helper functions to get network-specific configurations
export const getChainId = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return ARBITRUM_CHAIN_ID;
  return ETHEREUM_CHAIN_ID; // Default to Ethereum
};

export const getChainConfig = (network: 'ethereum' | 'arbitrum' | null) => {
  if (network === 'arbitrum') return ARBITRUM_CHAIN_CONFIG;
  return ETHEREUM_CHAIN_CONFIG; // Default to Ethereum
};

export const getUSDCTokenAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.USDC_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum_fund.USDC_TOKEN_ADDRESS; // Default to Ethereum
};

export const getSteleFundContractAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.STELE_FUND_CONTRACT_ADDRESS;
  // For Ethereum, use the regular STELE_CONTRACT_ADDRESS if STELE_FUND_CONTRACT_ADDRESS is not set
  const ethereumFundAddress = NETWORK_CONTRACTS.ethereum_fund.STELE_FUND_CONTRACT_ADDRESS;
  return ethereumFundAddress;
};

export const getRPCUrl = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.RPC_URL;
  return NETWORK_CONTRACTS.ethereum_fund.RPC_URL; // Default to Ethereum
};

export const getExplorerUrl = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.EXPLORER_URL;
  return NETWORK_CONTRACTS.ethereum_fund.EXPLORER_URL; // Default to Ethereum
};

export const getExplorerName = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.EXPLORER_NAME;
  return NETWORK_CONTRACTS.ethereum_fund.EXPLORER_NAME; // Default to Ethereum
};

// Helper functions to build explorer URLs for transactions and addresses
export const buildTransactionUrl = (network: 'ethereum' | 'arbitrum' | null, txHash: string): string => {
  const baseUrl = getExplorerUrl(network);
  return `${baseUrl}/tx/${txHash}`;
};

export const buildAddressUrl = (network: 'ethereum' | 'arbitrum' | null, address: string): string => {
  const baseUrl = getExplorerUrl(network);
  return `${baseUrl}/address/${address}`;
};

export const buildTokenUrl = (network: 'ethereum' | 'arbitrum' | null, tokenAddress: string): string => {
  const baseUrl = getExplorerUrl(network);
  return `${baseUrl}/token/${tokenAddress}`;
};

// Uniswap V3 related helper functions
export const getUniswapQuoterAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.UNISWAP_V3_QUOTER;
  return NETWORK_CONTRACTS.ethereum_fund.UNISWAP_V3_QUOTER; // Default to Ethereum
};

export const getMulticallAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.MULTICALL_CONTRACT;
  return NETWORK_CONTRACTS.ethereum_fund.MULTICALL_CONTRACT; // Default to Ethereum
};

export const getWETHAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.WETH_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum_fund.WETH_TOKEN_ADDRESS; // Default to Ethereum
};

export const getWBTCAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.WBTC_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum_fund.WBTC_TOKEN_ADDRESS; // Default to Ethereum
};

export const getUNIAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.UNI_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum_fund.UNI_TOKEN_ADDRESS; // Default to Ethereum
};

export const getLINKAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum_fund.LINK_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum_fund.LINK_TOKEN_ADDRESS; // Default to Ethereum
};

// Legacy exports for backward compatibility (these will use Ethereum by default)
export const USDC_TOKEN_ADDRESS = NETWORK_CONTRACTS.ethereum_fund.USDC_TOKEN_ADDRESS;
export const RPC_URL = NETWORK_CONTRACTS.ethereum_fund.RPC_URL;

// Token decimals
export const USDC_DECIMALS = 6;
export const STELE_DECIMALS = 18;

// Network-specific subgraph URLs
export const NETWORK_SUBGRAPHS = {
  // Use Studio subgraphs for both networks (they have consistent schema)
  ethereum_challenge: 'https://gateway.thegraph.com/api/subgraphs/id/7u34uNU3D1gyphYGrVdL3KDBLFFBAK57zQKu3yAxwDLh',
  arbitrum_challenge: 'https://gateway.thegraph.com/api/subgraphs/id/398WFwKPvggr9n5eLd2qkcz6eRKmwe8dBecfUVJpGXyF',
  ethereum_fund: 'https://gateway.thegraph.com/api/subgraphs/id/DiCAsTJ4qFo5MYXyWACacMUGncERSRjtBjDdcKqeovK3',
  arbitrum_fund: 'https://gateway.thegraph.com/api/subgraphs/id/26huqqfVGqcDKhduoYBHgFdxxty7Sk3UT18jtqRqQsAW'
} as const

// Helper function to get subgraph URL based on network
export const getSubgraphUrl = (network: 'ethereum' | 'arbitrum' | null, type: 'fund' | 'challenge' = 'challenge'): string => {
  // Filter to supported networks (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'

  let url: string
  let key: string

  if (type === 'fund') {
    key = `${subgraphNetwork}_fund`
    url = NETWORK_SUBGRAPHS[key as keyof typeof NETWORK_SUBGRAPHS]
  } else {
    key = `${subgraphNetwork}_challenge`
    url = NETWORK_SUBGRAPHS[key as keyof typeof NETWORK_SUBGRAPHS]
  }

  return url
}

// Helper function to get appropriate headers based on subgraph type
export const getSubgraphHeaders = (type: 'fund' | 'challenge' = 'challenge') => {
  if (type === 'fund') {
    return getFundHeaders()
  }
  return getChallengeHeaders()
}

// API keys for different subgraph types
export const NEXT_PUBLIC_THE_GRAPH_API_KEY = process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY
export const NEXT_PUBLIC_THE_GRAPH_API_KEY_FUND = process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY_FUND

// Headers for different subgraph types
export const getChallengeHeaders = () => ({
  Authorization: `Bearer ${NEXT_PUBLIC_THE_GRAPH_API_KEY}`
})

export const getFundHeaders = () => ({
  Authorization: `Bearer ${NEXT_PUBLIC_THE_GRAPH_API_KEY_FUND}`
})

export const BYTE_ZERO = "0x00000000"

// STELE Token total supply (1 billion tokens = 100,000,000 * 10^18)
export const STELE_TOTAL_SUPPLY = "100000000000000000000000000";

// WalletConnect configuration
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;