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
    STELE_CONTRACT_ADDRESS: "0x80b8366298341d5c913f4b2AfCfc141ec7635360",
    STELE_TOKEN_ADDRESS: "0x80E27E3a5e5e7025C67b79A8801366BAd87DA78A",
    USDC_TOKEN_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    GOVERNANCE_CONTRACT_ADDRESS: "0xeaa6b8d7c61C84db448c1DEE0678923B1a5dc15F",
    RPC_URL: 'https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://etherscan.io',
    EXPLORER_NAME: 'Etherscan'
  },
  arbitrum: {
    STELE_CONTRACT_ADDRESS: "0x9e977D928F33a949C8e0523292FFDFD47f1D0246",
    STELE_TOKEN_ADDRESS: "0x24dC9B6fF4bed5338FF4e0Fb2E6Ab074b5498798",
    USDC_TOKEN_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
    GOVERNANCE_CONTRACT_ADDRESS: "0x5E6858B551930438c89D70D938Cd032F67BAF7ae",
    RPC_URL: 'https://arbitrum-mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://arbiscan.io',
    EXPLORER_NAME: 'Arbiscan'
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

// Legacy exports for backward compatibility (these will use Ethereum by default)
export const STELE_CONTRACT_ADDRESS = NETWORK_CONTRACTS.ethereum.STELE_CONTRACT_ADDRESS;
export const STELE_TOKEN_ADDRESS = NETWORK_CONTRACTS.ethereum.STELE_TOKEN_ADDRESS;
export const USDC_TOKEN_ADDRESS = NETWORK_CONTRACTS.ethereum.USDC_TOKEN_ADDRESS;
export const GOVERNANCE_CONTRACT_ADDRESS = NETWORK_CONTRACTS.ethereum.GOVERNANCE_CONTRACT_ADDRESS;
export const RPC_URL = NETWORK_CONTRACTS.ethereum.RPC_URL;

// Token decimals
export const USDC_DECIMALS = 6;
export const STELE_DECIMALS = 18;

export const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/110372/stele/version/latest'
export const headers = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}` }
export const BYTE_ZERO = "0x00000000"

// STELE Token total supply (1 billion tokens = 100,000,000 * 10^18)
export const STELE_TOTAL_SUPPLY = "100000000000000000000000000";