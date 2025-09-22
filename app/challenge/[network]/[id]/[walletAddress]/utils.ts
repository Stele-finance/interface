import { SwapDetails, ChallengeDetails, TimeRemaining, PortfolioMetrics } from './types'

// Get swap details from transaction data
export const getSwapDetails = (transaction: any): SwapDetails | null => {
  if (transaction.type !== 'swap') return null
  
  // First try: Use the swap data from the transaction
  if (transaction.tokenInSymbol && transaction.tokenOutSymbol && transaction.tokenInAmount && transaction.tokenOutAmount) {
    const swapDetails = {
      fromAmount: parseFloat(transaction.tokenInAmount).toFixed(4),
      fromToken: transaction.tokenIn,
      fromTokenSymbol: transaction.tokenInSymbol,
      toAmount: parseFloat(transaction.tokenOutAmount).toFixed(4),
      toToken: transaction.tokenOut,
      toTokenSymbol: transaction.tokenOutSymbol
    }
    return swapDetails
  }
  
  // Second try: Parse from details string (format: "USDC → ETH" or "ETH → USDC")
  if (transaction.details && transaction.amount) {
    const arrowPattern = /(\w+)\s*→\s*(\w+)/i
    const match = transaction.details.match(arrowPattern)
    
    if (match) {
      // Extract amount from transaction.amount field (format: "0.1000 ETH")
      const amountMatch = transaction.amount.match(/([\d.]+)\s+(\w+)/)
      
      const swapDetails = {
        fromAmount: amountMatch ? amountMatch[1] : '0',
        fromToken: match[1],
        toAmount: '0', // We don't have the toAmount in this format
        toToken: match[2]
      }
      return swapDetails
    }
  }
  
  return null
}

// Format relative time (1 day, 1 hour, 1 minute, 1 week, etc.)
export const formatRelativeTime = (timestamp: number, t: (key: string) => string) => {
  const now = new Date().getTime()
  const transactionTime = timestamp * 1000
  const diffInSeconds = Math.floor((now - transactionTime) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}${t('secondShort')}`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}${t('minuteShort')}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}${t('hourShort')}`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}${t('dayShort')}`
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks}${t('weekShort')}`
  } else {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months}${t('monthShort')}`
  }
}

// Format token amount to limit decimal places for mobile display
export const formatTokenAmount = (amount: string) => {
  const num = parseFloat(amount)
  
  // If the number is 0 or invalid, return "0"
  if (isNaN(num) || num === 0) return "0"
  
  // For very small numbers (less than 0.00001), use scientific notation
  if (num < 0.00001 && num > 0) {
    return num.toExponential(2)
  }
  
  // For numbers >= 1000, show without decimals
  if (num >= 1000) {
    return num.toFixed(0)
  }
  
  // For numbers >= 1, limit to 5 decimal places maximum
  if (num >= 1) {
    return num.toFixed(5).replace(/\.?0+$/, '')
  }
  
  // For numbers < 1, show up to 5 decimal places, removing trailing zeros
  return num.toFixed(5).replace(/\.?0+$/, '')
}

// Get transaction type color
export const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'create':
      return 'text-purple-400'
    case 'join':
      return 'text-blue-400'
    case 'swap':
      return 'text-green-400'
    case 'register':
      return 'text-pink-400'
    case 'reward':
      return 'text-yellow-400'
    case 'airdrop':
      return 'text-orange-400'
    default:
      return 'text-gray-400'
  }
}

// Get transaction type display text
export const getTransactionTypeText = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'create':
      return t('create')
    case 'join':
      return t('join')
    case 'swap':
      return t('swap')
    case 'register':
      return t('register')
    case 'reward':
      return t('rewards')
    case 'airdrop':
      return t('airdrop')
    default:
      return type
  }
}

// Format user address
export const formatUserAddress = (address?: string) => {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return '';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Get token explorer URL based on network
export const getTokenExplorerUrl = (tokenAddress: string, subgraphNetwork: string) => {
  if (subgraphNetwork === 'arbitrum') {
    return `https://arbiscan.io/token/${tokenAddress}`
  }
  return `https://etherscan.io/token/${tokenAddress}`
}

// Get wallet address explorer URL based on network
export const getWalletExplorerUrl = (walletAddress: string, subgraphNetwork: string) => {
  if (subgraphNetwork === 'arbitrum') {
    return `https://arbiscan.io/address/${walletAddress}`
  }
  return `https://etherscan.io/address/${walletAddress}`
}

// Get appropriate explorer URL based on chain ID
export const getExplorerUrl = (chainId: string, txHash: string) => {
  switch (chainId) {
    case '0x1': // Ethereum Mainnet
      return `https://etherscan.io/tx/${txHash}`;
    case '0xa4b1': // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    default:
      return `https://etherscan.io/tx/${txHash}`; // Default to Ethereum
  }
};

export const getExplorerName = (chainId: string) => {
  switch (chainId) {
    case '0x1': // Ethereum Mainnet
      return 'Etherscan';
    case '0xa4b1': // Arbitrum One
      return 'Arbiscan';
    default:
      return 'Etherscan'; // Default to Ethereum
  }
};

// Get challenge details from real data
export const getChallengeDetails = (challengeData: any): ChallengeDetails | null => {
  if (challengeData?.challenge) {
    const challenge = challengeData.challenge;
    return {
      participants: parseInt(challenge.investorCounter),
      prize: `$${(parseInt(challenge.rewardAmountUSD) / 1e18).toFixed(2)}`, // Convert from wei to USD
      entryFee: `$${(parseInt(challenge.entryFee) / 1e6).toFixed(2)}`, // USDC has 6 decimals
      seedMoney: `$${(parseInt(challenge.seedMoney) / 1e6).toFixed(2)}`, // USDC has 6 decimals
      isActive: challenge.isActive,
      startTime: new Date(parseInt(challenge.startTime) * 1000),
      endTime: new Date(parseInt(challenge.endTime) * 1000),
    };
  }
  
  return null;
};

// Calculate time remaining from real challenge data
export const getTimeRemaining = (challengeDetails: ChallengeDetails | null, currentTime: Date, isClient: boolean, t: (key: string) => string): TimeRemaining => {
  if (!isClient) {
    return { text: t('loading'), subText: "Calculating time..." };
  }
  
  if (challengeDetails) {
    const endTime = challengeDetails.endTime;
    const diff = endTime.getTime() - currentTime.getTime();
    
    if (diff <= 0) {
      return { text: t('ended'), subText: `Ended on ${endTime.toLocaleDateString()}` };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeText: string;
    if (days > 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      timeText = `${months} ${t('months')} ${remainingDays} ${t('days')}`;
    } else if (days > 0) {
      timeText = `${days} ${t('days')} ${hours} ${t('hours')}`;
    } else if (hours > 0) {
      timeText = `${hours} ${t('hours')} ${minutes} ${t('minutes')}`;
    } else if (minutes > 0) {
      timeText = `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}`;
    } else {
      timeText = `${seconds} ${t('seconds')}`;
    }
    
    return { 
      text: timeText, 
      subText: `Ends on ${endTime.toLocaleDateString()}` 
    };
  }
  
  // Fallback
  return { text: t('loading'), subText: "Calculating time..." };
};

// Calculate portfolio metrics using the actual data structure
export const calculatePortfolioMetrics = (investor: any): PortfolioMetrics => {
  // USD values from subgraph are already in USD format, just parse as float
  const currentValue = parseFloat(investor.currentUSD) || 0
  const formattedSeedMoney = parseFloat(investor.seedMoneyUSD) || 0
  const gainLoss = currentValue - formattedSeedMoney
  const gainLossPercentage = formattedSeedMoney > 0 ? (gainLoss / formattedSeedMoney) * 100 : 0
  const isPositive = gainLoss >= 0

  return {
    currentValue,
    formattedSeedMoney,
    gainLoss,
    gainLossPercentage,
    isPositive
  }
} 