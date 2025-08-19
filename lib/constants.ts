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

// Known governance configurations (as fallbacks when API fails)
export const KNOWN_GOVERNANCE_CONFIGS = {
  ethereum: {
    votingPeriod: 50400, // ~7 days at 12 sec/block
    votingDelay: 3600,   // ~12 hours at 12 sec/block
  },
  arbitrum: {
    votingPeriod: 2400000, // ~7 days at 0.25 sec/block  
    votingDelay: 3600,     // ~0.25 hours at 0.25 sec/block
  }
} as const

// Network-specific Contract Addresses
export const NETWORK_CONTRACTS = {
  ethereum: {
    STELE_CONTRACT_ADDRESS: "0x3A2cB739032175b4Fc66De7F78bddC415972D2ff",
    STELE_TOKEN_ADDRESS: "0x71c24377e7f24b6d822C9dad967eBC77C04667b5",
    USDC_TOKEN_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    GOVERNANCE_CONTRACT_ADDRESS: "0xb574328BaeEe2E6eB1E9E44665fFF70075Ae1B09",
    // STELE FUND specific addresses (add appropriate Ethereum addresses)
    STELE_FUND_INFO_ADDRESS: "0x0000000000000000000000000000000000000000", // TODO: Add correct Ethereum address
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
  ethereum_fund: {
    STELE_CONTRACT_ADDRESS: "0x3A2cB739032175b4Fc66De7F78bddC415972D2ff",
    STELE_TOKEN_ADDRESS: "0x71c24377e7f24b6d822C9dad967eBC77C04667b5",
    USDC_TOKEN_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    GOVERNANCE_CONTRACT_ADDRESS: "0xb574328BaeEe2E6eB1E9E44665fFF70075Ae1B09",
    // STELE FUND specific addresses (add appropriate Ethereum addresses)
    STELE_FUND_INFO_ADDRESS: "0x0000000000000000000000000000000000000000", // TODO: Add correct Ethereum address
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
    STELE_CONTRACT_ADDRESS: "0x566D1769B3f66372E94fD18F59c757BCEc6efb8a",
    STELE_TOKEN_ADDRESS: "0x08C9c9EE6F161c6056060BF6AC7fE85e38638619",
    USDC_TOKEN_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
    GOVERNANCE_CONTRACT_ADDRESS: "0xC93fe38F52481F090E28E242B36f828C74F24142",
    RPC_URL: 'https://arbitrum-mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY,
    EXPLORER_URL: 'https://arbiscan.io',
    EXPLORER_NAME: 'Arbiscan',
    // Governance configuration
    // Uniswap V3 addresses (Arbitrum)
    UNISWAP_V3_QUOTER: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // QuoterV2
    MULTICALL_CONTRACT: "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
    WETH_TOKEN_ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // Arbitrum WETH
    WBTC_TOKEN_ADDRESS: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // Arbitrum WBTC
    UNI_TOKEN_ADDRESS: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",   // Arbitrum UNI
    LINK_TOKEN_ADDRESS: "0xd403D1624DAEF243FbcBd4A80d8A6F36afFe32b2"  // Arbitrum LINK
  },
  arbitrum_fund: {
    STELE_FUND_TOKEN_ADDRESS: "0x08C9c9EE6F161c6056060BF6AC7fE85e38638619",
    STELE_FUND_CONTRACT_ADDRESS: "0x5BDDBBB0B5F140038e9B2830C9347a0319DFE212",
    STELE_FUND_INFO_ADDRESS: "0xeb8cA3abaab8FA025616393c2112e96af30aeb90",
    STELE_FUND_SETTING_ADDRESS: "0x24C8d6Be85c6F627C5Ec3baFCd8268742cC1CFeE",
    STELE_FUND_GOVERNANCE_ADDRESS: "0x38143cfB0950cF7B56CFB1B277FF549D9d9dA432",
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
    LINK_TOKEN_ADDRESS: "0xd403D1624DAEF243FbcBd4A80d8A6F36afFe32b2"  // Arbitrum LINK
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
  arbitrum: 'https://gateway.thegraph.com/api/subgraphs/id/398WFwKPvggr9n5eLd2qkcz6eRKmwe8dBecfUVJpGXyF',
  ethereum_fund: 'https://api.studio.thegraph.com/query/110372/stele-fund-eth/version/latest',
  arbitrum_fund: 'https://api.studio.thegraph.com/query/110372/stele-fund-arbit/version/latest'
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

// WalletConnect configuration
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;