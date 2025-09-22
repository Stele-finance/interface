import { HTMLAttributes } from "react"
import { UserTokenInfo } from "@/app/hooks/useUserTokens"

export interface InvestableToken {
  id: string
  address: string
  decimals: string
  symbol: string
  updatedTimestamp: string
  isInvestable: boolean
}

export interface AssetSwapProps extends HTMLAttributes<HTMLDivElement> {
  userTokens?: UserTokenInfo[];
  investableTokens?: InvestableToken[];
  onSwappingStateChange?: (isSwapping: boolean) => void;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  priceImpact: number;
  minimumReceived: number;
  fees: {
    network: number;
    protocol: number;
  };
}

export interface SimpleSwapQuote {
  toAmount: number;
  exchangeRate: number;
}

export interface PriceData {
  tokens: {
    [symbol: string]: {
      priceUSD: number;
    };
  };
  timestamp: number;
  source: string;
}

export interface TokenSelectorProps {
  selectedToken: string;
  availableTokens: string[];
  onTokenSelect: (token: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  userTokens?: UserTokenInfo[];
  subgraphNetwork: 'ethereum' | 'arbitrum';
  getTokenAddress: (symbol: string) => string;
}

export interface SwapInputProps {
  amount: string;
  token: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: (token: string) => void;
  availableTokens: string[];
  userTokens: UserTokenInfo[];
  isFrom: boolean;
  subgraphNetwork: 'ethereum' | 'arbitrum';
  getTokenAddress: (symbol: string) => string;
  getTokenDecimals: (symbol: string) => number;
  getFormattedTokenBalance: (symbol: string) => string;
  handlePercentageClick?: (percentage: number) => void;
  getSwapAmountUSD?: () => number;
  isBelowMinimumSwapAmount?: () => boolean;
  isAmountExceedsBalance?: () => boolean;
  priceData?: any;
  toTokenPrice?: number;
}

export interface SwapButtonProps {
  fromAmount: string;
  fromToken: string;
  toToken: string;
  isDataReady: boolean;
  isSwapping: boolean;
  isAmountExceedsBalance: () => boolean;
  isBelowMinimumSwapAmount: () => boolean;
  onSwap: () => void;
  t: (key: any) => string;
} 