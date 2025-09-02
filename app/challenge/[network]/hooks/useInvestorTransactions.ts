'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, USDC_DECIMALS, headers } from '@/lib/constants'
import { ethers } from 'ethers'

const GET_INVESTOR_TRANSACTIONS_QUERY = `
  query GetInvestorTransactions($challengeId: BigInt!, $userAddress: Bytes!) {
    joins(
      where: { 
        challengeId: $challengeId,
        user: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      user
      seedMoney
      blockTimestamp
      transactionHash
    }
    swaps(
      where: { 
        challengeId: $challengeId,
        user: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      user
      tokenIn
      tokenInSymbol
      tokenInAmount
      tokenInPriceUSD
      tokenOut
      tokenOutSymbol
      tokenOutAmount
      tokenOutPriceUSD
      blockTimestamp
      transactionHash
    }
    registers(
      where: { 
        challengeId: $challengeId,
        user: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      user
      performance
      blockTimestamp
      transactionHash
    }
    rewards(
      where: { 
        challengeId: $challengeId,
        user: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      user
      rewardAmount
      blockTimestamp
      transactionHash
    }
    steleTokenBonuses(
      where: { 
        challengeId: $challengeId,
        user: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      user
      action
      amount
      blockTimestamp
      transactionHash
    }
  }
`

export interface InvestorTransactionData {
  type: 'join' | 'swap' | 'register' | 'reward' | 'airdrop'
  id: string
  challengeId: string
  user: string
  amount?: string
  details: string
  timestamp: number
  transactionHash: string
  // Additional data for swaps
  tokenIn?: string
  tokenOut?: string
  tokenInSymbol?: string
  tokenOutSymbol?: string
  tokenInAmount?: string
  tokenOutAmount?: string
}

interface GraphQLResponse {
  joins?: Array<{
    id: string
    challengeId: string
    user: string
    seedMoney: string
    blockTimestamp: string
    transactionHash: string
  }>
  swaps?: Array<{
    id: string
    challengeId: string
    user: string
    tokenIn: string
    tokenInSymbol: string
    tokenOut: string
    tokenOutSymbol: string
    tokenInAmount: string
    tokenInPriceUSD: string
    tokenOutPriceUSD: string
    tokenOutAmount: string
    blockTimestamp: string
    transactionHash: string
  }>
  registers?: Array<{
    id: string
    challengeId: string
    user: string
    performance: string
    blockTimestamp: string
    transactionHash: string
  }>
  rewards?: Array<{
    id: string
    challengeId: string
    user: string
    rewardAmount: string
    blockTimestamp: string
    transactionHash: string
  }>
  steleTokenBonuses?: Array<{
    id: string
    challengeId: string
    user: string
    action: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
}

export function useInvestorTransactions(challengeId: string, walletAddress: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery({
    queryKey: ['investorTransactions', challengeId, walletAddress, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_INVESTOR_TRANSACTIONS_QUERY, {
          challengeId: challengeId,
          userAddress: walletAddress.toLowerCase() // Ensure lowercase for address matching
        }, headers)

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        // Combine and sort all transactions by timestamp
        const allTransactions: InvestorTransactionData[] = []

        // Process joins
        if (data.joins && Array.isArray(data.joins)) {
          data.joins.forEach((join) => {
            allTransactions.push({
              type: 'join',
              id: join.id,
              challengeId: join.challengeId,
              user: join.user,
              amount: `$${(parseInt(join.seedMoney) / 1e6).toFixed(2)}`, // USDC has 6 decimals
              details: `${join.user} Joined`,
              timestamp: parseInt(join.blockTimestamp),
              transactionHash: join.transactionHash,
            })
          })
        }

        // Process swaps
        if (data.swaps && Array.isArray(data.swaps)) {
          data.swaps.forEach((swap) => {
            // Use symbol data from subgraph directly, fallback to address parsing if needed
            const fromSymbol = swap.tokenInSymbol || swap.tokenIn.slice(0, 6) + '...' + swap.tokenIn.slice(-4)
            const toSymbol = swap.tokenOutSymbol || swap.tokenOut.slice(0, 6) + '...' + swap.tokenOut.slice(-4)

            allTransactions.push({
              type: 'swap',
              id: swap.id,
              challengeId: swap.challengeId,
              user: swap.user,
              amount: `${parseFloat(swap.tokenInAmount.toString()).toFixed(4)} ${fromSymbol}`,
              details: `${fromSymbol} → ${toSymbol}`,
              timestamp: parseInt(swap.blockTimestamp),
              transactionHash: swap.transactionHash,
              // Add swap-specific data
              tokenIn: swap.tokenIn,
              tokenOut: swap.tokenOut,
              tokenInSymbol: fromSymbol,
              tokenOutSymbol: toSymbol,
              tokenInAmount: swap.tokenInAmount.toString(),
              tokenOutAmount: swap.tokenOutAmount.toString(),
            })
          })
        }

        // Process registers
        if (data.registers && Array.isArray(data.registers)) {
          data.registers.forEach((register) => {
            
            const performanceValue = parseFloat(ethers.formatUnits(register.performance, USDC_DECIMALS));
            
            allTransactions.push({
              type: 'register',
              id: register.id,
              challengeId: register.challengeId,
              user: register.user,
              amount: performanceValue.toFixed(6), // Show as score value with 6 decimal places
              details: `${register.user} Registered`,
              timestamp: parseInt(register.blockTimestamp),
              transactionHash: register.transactionHash,
            })
          })
        }

        // Process rewards
        if (data.rewards && Array.isArray(data.rewards)) {
          data.rewards.forEach((reward) => {
            const rewardValue = parseFloat(ethers.formatUnits(reward.rewardAmount, USDC_DECIMALS));
            const userAddress = `${reward.user.slice(0, 6)}...${reward.user.slice(-4)}`;
            
            allTransactions.push({
              type: 'reward',
              id: reward.id,
              challengeId: reward.challengeId,
              user: reward.user,
              amount: `$${rewardValue.toFixed(2)}`, // USDC has 6 decimals
              details: `Rewarded → ${userAddress}`,
              timestamp: parseInt(reward.blockTimestamp),
              transactionHash: reward.transactionHash,
            })
          })
        }

        // Process steleTokenBonuses
        if (data.steleTokenBonuses && Array.isArray(data.steleTokenBonuses)) {
          data.steleTokenBonuses.forEach((steleBonus) => {
            const bonusValue = parseFloat(ethers.formatUnits(steleBonus.amount, 18)); // Stele token has 18 decimals
            const userAddress = `${steleBonus.user.slice(0, 6)}...${steleBonus.user.slice(-4)}`;

            allTransactions.push({
              type: 'airdrop',
              id: steleBonus.id,
              challengeId: steleBonus.challengeId,
              user: steleBonus.user,
              amount: `${bonusValue.toFixed(4)}`,
              details: `${steleBonus.action} → ${userAddress}`,
              timestamp: parseInt(steleBonus.blockTimestamp),
              transactionHash: steleBonus.transactionHash,
            })
          })
        }
        // Sort by timestamp (newest first)
        return allTransactions.sort((a, b) => b.timestamp - a.timestamp)
      } catch (error) {
        console.error('❌ Error fetching investor transactions:', error)
 
        // If there's a network error, try to provide more context
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        
        // Return empty array instead of throwing to prevent UI crashes
        return []
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!(challengeId && walletAddress), // Only run if both parameters are provided
  })
} 