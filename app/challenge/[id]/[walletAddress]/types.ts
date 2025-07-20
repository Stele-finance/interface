export interface InvestorPageProps {
  params: Promise<{
    id: string
    walletAddress: string
  }>
}

export interface ChallengeDetails {
  participants: number
  prize: string
  entryFee: string
  seedMoney: string
  isActive: boolean
  startTime: Date
  endTime: Date
}

export interface TimeRemaining {
  text: string
  subText: string
}

export interface RealTimePortfolio {
  totalValue: number
  tokensWithPrices: number
  totalTokens: number
  timestamp: number
  isRegistered: boolean
}

export interface SwapDetails {
  fromAmount: string
  fromToken: string
  fromTokenSymbol?: string
  toAmount: string
  toToken: string
  toTokenSymbol?: string
}

export interface PortfolioMetrics {
  currentValue: number
  formattedSeedMoney: number
  gainLoss: number
  gainLossPercentage: number
  isPositive: boolean
} 