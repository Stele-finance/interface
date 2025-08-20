'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, headers } from '@/lib/constants'
import { ethers } from 'ethers'

const GET_FUND_ALL_TRANSACTIONS_QUERY = `
  query GetFundAllTransactions($fundId: BigInt!) {
    deposits(
      where: { 
        fundId: $fundId
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      token
      amount
      blockTimestamp
      transactionHash
    }
    depositFees(
      where: { 
        fundId: $fundId
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      token
      amount
      blockTimestamp
      transactionHash
    }
    swaps(
      where: { 
        fundId: $fundId
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
      amountIn
      amountOut
      blockTimestamp
      transactionHash
    }
    withdraws(
      where: { 
        fundId: $fundId
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      investor
      token
      amount
      feeAmount
      blockTimestamp
      transactionHash
    }
    withdrawFees(
      where: { 
        fundId: $fundId
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 50
    ) {
      id
      fundId
      manager
      token
      amount
      blockTimestamp
      transactionHash
    }
    creates(
      where: { 
        fundId: $fundId
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
        fundId: $fundId
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

export interface FundTransaction {
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
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  depositFees?: Array<{
    id: string
    fundId: string
    investor: string
    token: string
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
    amountIn: string
    amountOut: string
    blockTimestamp: string
    transactionHash: string
  }>
  withdraws?: Array<{
    id: string
    fundId: string
    investor: string
    token: string
    amount: string
    feeAmount: string
    blockTimestamp: string
    transactionHash: string
  }>
  withdrawFees?: Array<{
    id: string
    fundId: string
    manager: string
    token: string
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

export function useFundAllTransactions(fundId: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Use Fund-specific subgraph URL
  const fundNetwork = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
  const subgraphUrl = NETWORK_SUBGRAPHS[fundNetwork]
  
  return useQuery({
    queryKey: ['fundAllTransactions', fundId, network],
    queryFn: async () => {      
      try {
        const data = await request<GraphQLResponse>(subgraphUrl, GET_FUND_ALL_TRANSACTIONS_QUERY, {
          fundId: fundId
        }, headers)

        // Check if data is valid
        if (!data) {
          console.error('❌ GraphQL response is null or undefined')
          return []
        }

        // Combine and sort all transactions by timestamp
        const allTransactions: FundTransaction[] = []

        // Process deposits
        if (data.deposits && Array.isArray(data.deposits)) {
          data.deposits.forEach((deposit) => {
            const tokenSymbol = getTokenSymbol(deposit.token)
            const amount = ethers.formatEther(deposit.amount)
            
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
            const tokenSymbol = getTokenSymbol(fee.token)
            const amount = ethers.formatEther(fee.amount)
            
            allTransactions.push({
              type: 'depositFee',
              id: fee.id,
              fundId: fee.fundId,
              user: fee.investor,
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
            const tokenInSymbol = getTokenSymbol(swap.tokenIn)
            const tokenOutSymbol = getTokenSymbol(swap.tokenOut)
            const amountIn = ethers.formatEther(swap.amountIn)
            const amountOut = ethers.formatEther(swap.amountOut)

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
              amountIn: swap.amountIn,
              amountOut: swap.amountOut,
            })
          })
        }

        // Process withdraws
        if (data.withdraws && Array.isArray(data.withdraws)) {
          data.withdraws.forEach((withdraw) => {
            const tokenSymbol = getTokenSymbol(withdraw.token)
            const amount = ethers.formatEther(withdraw.amount)
            const feeAmount = ethers.formatEther(withdraw.feeAmount)
            
            allTransactions.push({
              type: 'withdraw',
              id: withdraw.id,
              fundId: withdraw.fundId,
              user: withdraw.investor,
              amount: `${parseFloat(amount).toFixed(4)} ${tokenSymbol}`,
              details: `Withdrew ${tokenSymbol} (Fee: ${parseFloat(feeAmount).toFixed(4)})`,
              timestamp: parseInt(withdraw.blockTimestamp),
              transactionHash: withdraw.transactionHash,
              feeAmount: withdraw.feeAmount,
            })
          })
        }

        // Process withdraw fees
        if (data.withdrawFees && Array.isArray(data.withdrawFees)) {
          data.withdrawFees.forEach((fee) => {
            const tokenSymbol = getTokenSymbol(fee.token)
            const amount = ethers.formatEther(fee.amount)
            
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
    enabled: !!fundId, // Only run if fundId is provided
  })
}