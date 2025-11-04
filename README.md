# Stele - Decentralized Crypto Fund Platform

**Stele** is a decentralized platform for creating and managing cryptocurrency investment funds. Built on Ethereum and Arbitrum networks, Stele enables fund managers to create on-chain investment funds and allows investors to participate in professionally managed crypto portfolios.

## Development Commands

**Node Version**: Use Node.js 23 (`nvm use 23`)

```bash
nvm use 23

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

## Environment Configuration

Required environment variables in `.env`:
```bash
NEXT_PUBLIC_THE_GRAPH_API_KEY=your_the_graph_api_key_here
NEXT_PUBLIC_THE_GRAPH_API_KEY_FUND=your_the_graph_api_key_for_fund_here
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_here
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) with custom hooks
- **Blockchain**: Ethers.js v6 with Reown AppKit (formerly WalletConnect)
- **Data Sources**: The Graph Protocol subgraphs, Uniswap V3 quoter
- **UI Components**: Radix UI primitives with custom styling

## Multi-Network Support

The application operates on two primary networks:
- **Ethereum Mainnet** (Chain ID: 1)
- **Arbitrum One** (Chain ID: 42161)

Network-specific configurations are centralized in `lib/constants.ts` with helper functions for:
- Contract addresses (Fund contracts, USDC, governance)
- RPC URLs and block explorers
- Subgraph endpoints
- Block time calculations for governance

## Key Features

### Investment Funds
- **Fund Creation**: Managers can create on-chain investment funds
- **Fund Management**: Real-time portfolio tracking and token swapping via Uniswap V3
- **Investor Participation**: Join funds and track portfolio performance
- **NFT Certificates**: Fund managers receive NFT certificates
- **Performance Tracking**: Historical snapshots and analytics

### Governance System
- Proposal creation and voting
- Multi-network governance contract integration
- Voting period calculations adjusted for network block times

### Portfolio Management
- Multi-token portfolio tracking
- USD value calculations with real-time pricing
- Transaction history and analytics
- Manager fee system

## Route Structure

```
/home                                      # Landing page
/funds                                     # Fund list page
/fund/[network]/[id]                       # Fund detail page
/fund/[network]/[id]/[walletAddress]       # Investor-specific fund view
/nft/fund                                  # Fund NFT gallery
/vote/[id]                                 # Governance proposals
```

## Architecture

### Data Layer
- Custom hooks in `app/hooks/` for blockchain interactions
- Fund-specific hooks in `app/fund/hooks/`
- React Query for caching and state synchronization
- GraphQL queries to The Graph subgraphs

### Component Organization
- Page-level components in route directories
- Shared UI components in `components/ui/` (shadcn/ui)
- Feature-specific components co-located with pages
- Global components in `components/` root

### Wallet Integration
Uses Reown AppKit (WalletConnect v2) with custom wallet state management:
- Global state via custom subscription pattern
- Network switching with automatic chain addition
- WalletConnect-only integration (MetaMask, Phantom supported)
- Mobile-responsive wallet connection flow

### Internationalization
Comprehensive i18n support with:
- 24+ language translations in `lib/translations/`
- Auto-detection via `/api/detect-language/` endpoint
- Context-based language switching
- RTL support for Arabic and Hebrew

### Smart Contract Integration
- ABI definitions in `app/abis/` for Fund, governance, and ERC20 contracts
- Ethers.js contract interactions with provider management
- Multi-network contract address resolution
- Uniswap V3 price quotations and swap execution

### Styling System
- Tailwind CSS with custom theme in `tailwind.config.ts`
- CSS variable-based theming for dark/light modes
- shadcn/ui component library for consistent UI patterns
- Responsive design with mobile-first approach
- Custom animations (fade-in, fade-in-delayed, etc.)

## Development Notes

**Network Handling**: Always use network parameter from route or wallet state to determine correct contract addresses and configurations.

**State Management**: Prefer React Query for server state and custom hooks for complex blockchain interactions.

**Component Patterns**: Use shadcn/ui components as base, extend with custom styling rather than creating from scratch.

**Error Handling**: Implement proper error boundaries and loading states, especially for wallet and network operations.

**Performance**: Leverage React Query caching for expensive blockchain calls and GraphQL queries.

## License

[Your License Here]
