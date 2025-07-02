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

// Mainnet

// Contract Addresses
export const STELE_CONTRACT_ADDRESS = "0x80b8366298341d5c913f4b2AfCfc141ec7635360";
export const STELE_TOKEN_ADDRESS = "0x80E27E3a5e5e7025C67b79A8801366BAd87DA78A"; // Stele Token for voting
export const USDC_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC
export const GOVERNANCE_CONTRACT_ADDRESS = "0xeaa6b8d7c61C84db448c1DEE0678923B1a5dc15F"; // Mainnet Governance
export const RPC_URL = 'https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY;

// Token decimals
export const USDC_DECIMALS = 6;
export const STELE_DECIMALS = 18;

export const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/110372/stele/version/latest'
export const headers = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY}` }
export const BYTE_ZERO = "0x00000000"

// STELE Token total supply (1 billion tokens = 100,000,000 * 10^18)
export const STELE_TOTAL_SUPPLY = "100000000000000000000000000";