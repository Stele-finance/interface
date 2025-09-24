'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { getSubgraphUrl, USDC_DECIMALS, getChallengeHeaders } from '@/lib/constants'
import { ethers } from 'ethers'

const GET_TRANSACTIONS_QUERY = `
  query GetTransactions($challengeId: BigInt!) {
    creates(
      where: { challengeId: $challengeId }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      challengeId
      challengeType
      blockTimestamp
      transactionHash
    }
    joins(
      where: { challengeId: $challengeId }
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
      where: { challengeId: $challengeId }
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
      where: { challengeId: $challengeId }
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
      where: { challengeId: $challengeId }
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
      where: { challengeId: $challengeId }
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

const GET_ALL_TRANSACTIONS_QUERY = `
  query GetAllTransactions {
    creates(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      challengeId
      challengeType
      blockTimestamp
      transactionHash
    }
    joins(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      challengeId
      user
      seedMoney
      blockTimestamp
      transactionHash
    }
    swaps(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      challengeId
      user
      tokenIn
      tokenInSymbol
      tokenOut
      tokenOutSymbol
      tokenInAmount
      tokenInPriceUSD
      tokenOutPriceUSD
      tokenOutAmount
      blockTimestamp
      transactionHash
    }
    registers(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      challengeId
      user
      performance
      blockTimestamp
      transactionHash
    }
    rewards(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      challengeId
      user
      rewardAmount
      blockTimestamp
      transactionHash
    }
    steleTokenBonuses(
      orderBy: blockTimestamp
      orderDirection: desc
      first: 10
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

export interface TransactionData {
  type: 'create' | 'join' | 'swap' | 'register' | 'reward' | 'airdrop'
  id: string
  challengeId: string
  user?: string
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
  creates?: Array<{
    id: string
    challengeId: string
    challengeType: number
    blockTimestamp: string
    transactionHash: string
  }>
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

export function useTransactions(challengeId: string, network: 'ethereum' | 'arbitrum' | null = 'ethereum') {
  const subgraphUrl = getSubgraphUrl(network)
  
  return useQuery({
    queryKey: ['transactions', challengeId, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_TRANSACTIONS_QUERY, {
          challengeId: challengeId
        }, getChallengeHeaders())

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        // Combine and sort all transactions by timestamp
        const allTransactions: TransactionData[] = []

        // Process creates
        if (data.creates && Array.isArray(data.creates)) {
          data.creates.forEach((create) => {
            allTransactions.push({
              type: 'create',
              id: create.id,
              challengeId: create.challengeId,
              details: `Challenge Created`,
              timestamp: parseInt(create.blockTimestamp),
              transactionHash: create.transactionHash,
            })
          })
        }

        // Process joins
        if (data.joins && Array.isArray(data.joins)) {
          data.joins.forEach((join) => {
            const userAddress = `${join.user.slice(0, 6)}...${join.user.slice(-4)}`;
            allTransactions.push({
              type: 'join',
              id: join.id,
              challengeId: join.challengeId,
              user: join.user,
              amount: `$${(parseInt(join.seedMoney) / 1e6).toFixed(2)}`, // USDC has 6 decimals
              details: `${userAddress} Joined`,
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
            const userAddress = `${register.user.slice(0, 6)}...${register.user.slice(-4)}`;
            const performanceValue = parseFloat(ethers.formatUnits(register.performance, USDC_DECIMALS));
            
            allTransactions.push({
              type: 'register',
              id: register.id,
              challengeId: register.challengeId,
              user: register.user,
              amount: performanceValue.toFixed(6), // Show as score value with 6 decimal places
              details: `${userAddress} Registered`,
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
            const userAddress = `${steleBonus.user.slice(0, 6)}...${steleBonus.user.slice(-4)}`;
            const bonusValue = parseFloat(ethers.formatUnits(steleBonus.amount, 18)); // Stele token has 18 decimals
            
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

        // If no transactions found for this challengeId, let's also try to fetch some general data
        if (allTransactions.length === 0) {          
          try {
            const allData = await request<GraphQLResponse>(subgraphUrl, GET_ALL_TRANSACTIONS_QUERY, {}, getChallengeHeaders()) 
            if (allData) {
              // Show what challengeIds are available
              const availableChallengeIds = new Set()
              allData.creates?.forEach(t => availableChallengeIds.add(t.challengeId))
              allData.joins?.forEach(t => availableChallengeIds.add(t.challengeId))
              allData.swaps?.forEach(t => availableChallengeIds.add(t.challengeId))
              allData.registers?.forEach(t => availableChallengeIds.add(t.challengeId))
              allData.rewards?.forEach(t => availableChallengeIds.add(t.challengeId))
              allData.steleTokenBonuses?.forEach(t => availableChallengeIds.add(t.challengeId))
            }
          } catch (debugError) {
            console.error('🔍 Could not fetch debug data:', debugError)
          }
        }

        // Sort by timestamp (newest first)
        return allTransactions.sort((a, b) => b.timestamp - a.timestamp)
      } catch (error) {
        console.error('❌ Error fetching transactions:', error)
        
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
    gcTime: 300000, // 5 minutes,
  })
}