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
export const ARBITRUM_BLOCK_TIME_MS = 1; // ~1 second per block

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

// Network-specific Contract Addresses
const NETWORK_CONTRACTS = {
  ethereum: {
    STELE_CONTRACT_ADDRESS: "0x3A2cB739032175b4Fc66De7F78bddC415972D2ff",
    STELE_TOKEN_ADDRESS: "0x71c24377e7f24b6d822C9dad967eBC77C04667b5",
    USDC_TOKEN_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    GOVERNANCE_CONTRACT_ADDRESS: "0xb574328BaeEe2E6eB1E9E44665fFF70075Ae1B09",
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
  arbitrum: {
    STELE_CONTRACT_ADDRESS: "0xE96DBE76143C3caD02Ed03dB53f8cdF67389Ab0A",
    STELE_TOKEN_ADDRESS: "0x5763a0523A672d7c88127e10533bA78853454510",
    USDC_TOKEN_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
    GOVERNANCE_CONTRACT_ADDRESS: "0x7909ed39e1836cB4050dbD21F66b5113FF121cc4",
    RPC_URL: 'https://arbitrum-mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://arbiscan.io',
    EXPLORER_NAME: 'Arbiscan',
    // Uniswap V3 addresses (Arbitrum)
    UNISWAP_V3_QUOTER: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // QuoterV2
    MULTICALL_CONTRACT: "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
    WETH_TOKEN_ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // Arbitrum WETH
    WBTC_TOKEN_ADDRESS: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // Arbitrum WBTC
    UNI_TOKEN_ADDRESS: "0xfb3CB973B2a9e2E09746393C59e7FB0d5189d290",   // Arbitrum UNI
    LINK_TOKEN_ADDRESS: "0xd403D1624DAEF243FbcBd4A80d8A6F36afFe32b2"  // Arbitrum LINK
  }
} as const;

// Helper functions to get network-specific configurations
export const getChainId = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return ARBITRUM_CHAIN_ID;
  return ETHEREUM_CHAIN_ID; // Default to Ethereum
};

export const getChainConfig = (network: 'ethereum' | 'arbitrum' | null) => {
  if (network === 'arbitrum') return ARBITRUM_CHAIN_CONFIG;
  return ETHEREUM_CHAIN_CONFIG; // Default to Ethereum
};

export const getSteleContractAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.STELE_CONTRACT_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.STELE_CONTRACT_ADDRESS; // Default to Ethereum
};

export const getSteleTokenAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.STELE_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.STELE_TOKEN_ADDRESS; // Default to Ethereum
};

export const getUSDCTokenAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.USDC_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.USDC_TOKEN_ADDRESS; // Default to Ethereum
};

export const getGovernanceContractAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.GOVERNANCE_CONTRACT_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.GOVERNANCE_CONTRACT_ADDRESS; // Default to Ethereum
};

export const getRPCUrl = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.RPC_URL;
  return NETWORK_CONTRACTS.ethereum.RPC_URL; // Default to Ethereum
};

export const getExplorerUrl = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.EXPLORER_URL;
  return NETWORK_CONTRACTS.ethereum.EXPLORER_URL; // Default to Ethereum
};

export const getExplorerName = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.EXPLORER_NAME;
  return NETWORK_CONTRACTS.ethereum.EXPLORER_NAME; // Default to Ethereum
};

// Uniswap V3 related helper functions
export const getUniswapQuoterAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.UNISWAP_V3_QUOTER;
  return NETWORK_CONTRACTS.ethereum.UNISWAP_V3_QUOTER; // Default to Ethereum
};

export const getMulticallAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.MULTICALL_CONTRACT;
  return NETWORK_CONTRACTS.ethereum.MULTICALL_CONTRACT; // Default to Ethereum
};

export const getWETHAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.WETH_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.WETH_TOKEN_ADDRESS; // Default to Ethereum
};

export const getWBTCAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.WBTC_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.WBTC_TOKEN_ADDRESS; // Default to Ethereum
};

export const getUNIAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.UNI_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.UNI_TOKEN_ADDRESS; // Default to Ethereum
};

export const getLINKAddress = (network: 'ethereum' | 'arbitrum' | null): string => {
  if (network === 'arbitrum') return NETWORK_CONTRACTS.arbitrum.LINK_TOKEN_ADDRESS;
  return NETWORK_CONTRACTS.ethereum.LINK_TOKEN_ADDRESS; // Default to Ethereum
};

// Legacy exports for backward compatibility (these will use Ethereum by default)
export const STELE_CONTRACT_ADDRESS = NETWORK_CONTRACTS.ethereum.STELE_CONTRACT_ADDRESS;
export const STELE_TOKEN_ADDRESS = NETWORK_CONTRACTS.ethereum.STELE_TOKEN_ADDRESS;
export const USDC_TOKEN_ADDRESS = NETWORK_CONTRACTS.ethereum.USDC_TOKEN_ADDRESS;
export const GOVERNANCE_CONTRACT_ADDRESS = NETWORK_CONTRACTS.ethereum.GOVERNANCE_CONTRACT_ADDRESS;
export const RPC_URL = NETWORK_CONTRACTS.ethereum.RPC_URL;

// Token decimals
export const USDC_DECIMALS = 6;
export const STELE_DECIMALS = 18;

// Network-specific subgraph URLs
export const NETWORK_SUBGRAPHS = {
  ethereum: 'https://gateway.thegraph.com/api/subgraphs/id/7u34uNU3D1gyphYGrVdL3KDBLFFBAK57zQKu3yAxwDLh',
  arbitrum: 'https://gateway.thegraph.com/api/subgraphs/id/398WFwKPvggr9n5eLd2qkcz6eRKmwe8dBecfUVJpGXyF'
} as const

// Helper function to get subgraph URL based on network
export const getSubgraphUrl = (network: 'ethereum' | 'arbitrum' | null): string => {
  // Filter to supported networks (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  return NETWORK_SUBGRAPHS[subgraphNetwork]
}
export const headers = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}` }
export const BYTE_ZERO = "0x00000000"

// STELE Token total supply (1 billion tokens = 100,000,000 * 10^18)
export const STELE_TOTAL_SUPPLY = "100000000000000000000000000";