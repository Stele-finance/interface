'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, headers } from '@/lib/constants'
import { ethers } from 'ethers'

const GET_FUND_TRANSACTIONS_QUERY = `
  query GetFundTransactions($fundId: BigInt!, $userAddress: Bytes!) {
    deposits(
      where: { 
        fundId: $fundId,
        investor: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      token
      symbol
      amount
      share
      totalShare
      blockTimestamp
      transactionHash
    }
    depositFees(
      where: { 
        fundId: $fundId,
        manager: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      manager
      token
      symbol
      amount
      blockTimestamp
      transactionHash
    }
    swaps(
      where: { 
        fundId: $fundId,
        investor: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      tokenIn
      tokenOut
      tokenInSymbol
      tokenOutSymbol
      tokenInAmount
      tokenOutAmount
      blockTimestamp
      transactionHash
    }
    withdraws(
      where: { 
        fundId: $fundId,
        investor: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      share
      totalShare
      blockTimestamp
      transactionHash
    }
    withdrawFees(
      where: { 
        fundId: $fundId,
        manager: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      manager
      token
      symbol
      amount
      blockTimestamp
      transactionHash
    }
    creates(
      where: { 
        fundId: $fundId,
        manager: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      manager
      blockTimestamp
      transactionHash
    }
    joins(
      where: { 
        fundId: $fundId,
        investor: $userAddress
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      blockTimestamp
      transactionHash
    }
  }
`

export interface FundTransactionData {
  type: 'deposit' | 'depositFee' | 'swap' | 'withdraw' | 'withdrawFee' | 'create' | 'join'
  id: string
  fundId: string
  user: string
  amount?: string
  details: string
  timestamp: number
  transactionHash: string
  // Additional data for swaps
  tokenIn?: string
  tokenOut?: string
  amountIn?: string
  amountOut?: string
  // Additional data for withdraws
  feeAmount?: string
}

interface GraphQLResponse {
  deposits?: Array<{
    id: string
    fundId: string
    investor: string
    token: string
    symbol: string
    amount: string
    share: string
    totalShare: string
    blockTimestamp: string
    transactionHash: string
  }>
  depositFees?: Array<{
    id: string
    fundId: string
    manager: string
    token: string
    symbol: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  swaps?: Array<{
    id: string
    fundId: string
    investor: string
    tokenIn: string
    tokenOut: string
    tokenInSymbol: string
    tokenOutSymbol: string
    tokenInAmount: string
    tokenOutAmount: string
    blockTimestamp: string
    transactionHash: string
  }>
  withdraws?: Array<{
    id: string
    fundId: string
    investor: string
    share: string
    totalShare: string
    blockTimestamp: string
    transactionHash: string
  }>
  withdrawFees?: Array<{
    id: string
    fundId: string
    manager: string
    token: string
    symbol: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  creates?: Array<{
    id: string
    fundId: string
    manager: string
    blockTimestamp: string
    transactionHash: string
  }>
  joins?: Array<{
    id: string
    fundId: string
    investor: string
    blockTimestamp: string
    transactionHash: string
  }>
}

// Helper function to get token symbol from address
const getTokenSymbol = (tokenAddress: string): string => {
  const lowerAddress = tokenAddress.toLowerCase()
  // Add known token mappings for the fund network
  const tokenMap: { [key: string]: string } = {
    '0x0000000000000000000000000000000000000000': 'ETH',
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'WETH', // Arbitrum WETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH', // Ethereum WETH
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC', // Arbitrum USDC
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', // Ethereum USDC
  }
  
  return tokenMap[lowerAddress] || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`
}

export function useFundTransactions(fundId: string, walletAddress: string, network: 'ethereum' | 'arbitrum' | null = 'arbitrum') {
  // Use Fund-specific subgraph URL
  const fundNetwork = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
  const subgraphUrl = NETWORK_SUBGRAPHS[fundNetwork]
  
  return useQuery({
    queryKey: ['fundTransactions', fundId, walletAddress, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_FUND_TRANSACTIONS_QUERY, {
          fundId: fundId,
          userAddress: walletAddress.toLowerCase() // Ensure lowercase for address matching
        }, headers)

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        // Combine and sort all transactions by timestamp
        const allTransactions: FundTransactionData[] = []

        // Process deposits
        if (data.deposits && Array.isArray(data.deposits)) {
          data.deposits.forEach((deposit) => {
            const tokenSymbol = deposit.symbol || getTokenSymbol(deposit.token)
            const amount = deposit.amount
            
            allTransactions.push({
              type: 'deposit',
              id: deposit.id,
              fundId: deposit.fundId,
              user: deposit.investor,
              amount: `${parseFloat(amount).toFixed(4)} ${tokenSymbol}`,
              details: `Deposited ${tokenSymbol}`,
              timestamp: parseInt(deposit.blockTimestamp),
              transactionHash: deposit.transactionHash,
            })
          })
        }

        // Process deposit fees
        if (data.depositFees && Array.isArray(data.depositFees)) {
          data.depositFees.forEach((fee) => {
            const tokenSymbol = fee.symbol || getTokenSymbol(fee.token)
            const amount = fee.amount
            
            allTransactions.push({
              type: 'depositFee',
              id: fee.id,
              fundId: fee.fundId,
              user: fee.manager,
              amount: `${parseFloat(amount).toFixed(4)} ${tokenSymbol}`,
              details: `Deposit Fee (${tokenSymbol})`,
              timestamp: parseInt(fee.blockTimestamp),
              transactionHash: fee.transactionHash,
            })
          })
        }

        // Process swaps
        if (data.swaps && Array.isArray(data.swaps)) {
          data.swaps.forEach((swap) => {
            const tokenInSymbol = swap.tokenInSymbol || getTokenSymbol(swap.tokenIn)
            const tokenOutSymbol = swap.tokenOutSymbol || getTokenSymbol(swap.tokenOut)
            const amountIn = swap.tokenInAmount
            const amountOut = swap.tokenOutAmount

            allTransactions.push({
              type: 'swap',
              id: swap.id,
              fundId: swap.fundId,
              user: swap.investor,
              amount: `${parseFloat(amountIn).toFixed(4)} ${tokenInSymbol}`,
              details: `${tokenInSymbol} → ${tokenOutSymbol}`,
              timestamp: parseInt(swap.blockTimestamp),
              transactionHash: swap.transactionHash,
              tokenIn: swap.tokenIn,
              tokenOut: swap.tokenOut,
              amountIn: swap.tokenInAmount,
              amountOut: swap.tokenOutAmount,
            })
          })
        }

        // Process withdraws
        if (data.withdraws && Array.isArray(data.withdraws)) {
          data.withdraws.forEach((withdraw) => {
            const shareAmount = withdraw.share
            const totalShare = withdraw.totalShare
            
            allTransactions.push({
              type: 'withdraw',
              id: withdraw.id,
              fundId: withdraw.fundId,
              user: withdraw.investor,
              amount: `${shareAmount} shares`,
              details: `Withdrew ${shareAmount} shares (${((parseFloat(shareAmount) / parseFloat(totalShare)) * 100).toFixed(2)}%)`,
              timestamp: parseInt(withdraw.blockTimestamp),
              transactionHash: withdraw.transactionHash,
            })
          })
        }

        // Process withdraw fees
        if (data.withdrawFees && Array.isArray(data.withdrawFees)) {
          data.withdrawFees.forEach((fee) => {
            const tokenSymbol = fee.symbol || getTokenSymbol(fee.token)
            const amount = fee.amount
            
            allTransactions.push({
              type: 'withdrawFee',
              id: fee.id,
              fundId: fee.fundId,
              user: fee.manager,
              amount: `${parseFloat(amount).toFixed(4)} ${tokenSymbol}`,
              details: `Withdraw Fee Collected (${tokenSymbol})`,
              timestamp: parseInt(fee.blockTimestamp),
              transactionHash: fee.transactionHash,
            })
          })
        }

        // Process creates
        if (data.creates && Array.isArray(data.creates)) {
          data.creates.forEach((create) => {
            allTransactions.push({
              type: 'create',
              id: create.id,
              fundId: create.fundId,
              user: create.manager,
              details: `Fund Created`,
              timestamp: parseInt(create.blockTimestamp),
              transactionHash: create.transactionHash,
            })
          })
        }

        // Process joins
        if (data.joins && Array.isArray(data.joins)) {
          data.joins.forEach((join) => {
            allTransactions.push({
              type: 'join',
              id: join.id,
              fundId: join.fundId,
              user: join.investor,
              details: `Joined Fund`,
              timestamp: parseInt(join.blockTimestamp),
              transactionHash: join.transactionHash,
            })
          })
        }

        // Sort by timestamp (newest first)
        return allTransactions.sort((a, b) => b.timestamp - a.timestamp)
      } catch (error) {
        console.error('❌ Error fetching fund transactions:', error)
 
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
    enabled: !!(fundId && walletAddress), // Only run if both parameters are provided
  })
}