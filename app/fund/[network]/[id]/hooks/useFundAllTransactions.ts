'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'

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
      symbol
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
      tokenInSymbol
      tokenOutSymbol
      tokenInAmount
      tokenOutAmount
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
      percentage
      amountUSD
      tokens
      tokensSymbols
      tokensDecimals
      tokensAmount
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
      symbol
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
  type: 'deposit' | 'swap' | 'withdraw' | 'withdrawFee' | 'create' | 'join'
  id: string
  fundId: string
  user: string
  amount?: string
  details: string
  timestamp: number
  transactionHash: string
  // Token data for all transaction types
  token?: string
  symbol?: string
  // Additional data for swaps
  tokenIn?: string
  tokenOut?: string
  tokenInSymbol?: string
  tokenOutSymbol?: string
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
    percentage: string
    amountUSD: string
    tokens: string[]
    tokensSymbols: string[]
    tokensDecimals: string[]
    tokensAmount: string[]
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
        }, getFundHeaders())

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
            // Format amount to max 6 decimal places
            const formattedAmount = parseFloat(deposit.amount).toFixed(6).replace(/\.?0+$/, '')
            
            allTransactions.push({
              type: 'deposit',
              id: deposit.id,
              fundId: deposit.fundId,
              user: deposit.investor,
              amount: formattedAmount, // Only amount, no symbol, max 6 decimals
              details: `Deposited ${deposit.symbol}`,
              timestamp: parseInt(deposit.blockTimestamp),
              transactionHash: deposit.transactionHash,
              token: deposit.token,
              symbol: deposit.symbol,
            })
          })
        }

        // Process swaps
        if (data.swaps && Array.isArray(data.swaps)) {
          data.swaps.forEach((swap) => {
            // Format amounts to max 6 decimal places
            const formattedAmountIn = parseFloat(swap.tokenInAmount).toFixed(6).replace(/\.?0+$/, '')
            const formattedAmountOut = parseFloat(swap.tokenOutAmount).toFixed(6).replace(/\.?0+$/, '')
            
            allTransactions.push({
              type: 'swap',
              id: swap.id,
              fundId: swap.fundId,
              user: swap.investor,
              amount: formattedAmountIn, // Only amount, no symbol
              details: `${swap.tokenInSymbol} → ${swap.tokenOutSymbol}`,
              timestamp: parseInt(swap.blockTimestamp),
              transactionHash: swap.transactionHash,
              tokenIn: swap.tokenIn,
              tokenOut: swap.tokenOut,
              tokenInSymbol: swap.tokenInSymbol,
              tokenOutSymbol: swap.tokenOutSymbol,
              amountIn: formattedAmountIn,
              amountOut: formattedAmountOut,
            })
          })
        }

        // Process withdraws - now with individual token data
        if (data.withdraws && Array.isArray(data.withdraws)) {
          data.withdraws.forEach((withdraw) => {
            // If withdraw has tokens data, create a transaction for each token
            if (withdraw.tokens && withdraw.tokens.length > 0) {
              withdraw.tokens.forEach((tokenAddress, index) => {
                const tokenSymbol = withdraw.tokensSymbols[index] || 'UNKNOWN'
                const tokenAmount = withdraw.tokensAmount[index] || '0'
                const formattedAmount = parseFloat(tokenAmount).toFixed(6).replace(/\.?0+$/, '')

                allTransactions.push({
                  type: 'withdraw',
                  id: `${withdraw.id}-${index}`,
                  fundId: withdraw.fundId,
                  user: withdraw.investor,
                  amount: formattedAmount,
                  details: `Withdrew ${tokenSymbol}`,
                  timestamp: parseInt(withdraw.blockTimestamp),
                  transactionHash: withdraw.transactionHash,
                  token: tokenAddress,
                  symbol: tokenSymbol,
                })
              })
            } else {
              // Fallback for old withdraws without token data
              const percentage = parseFloat(withdraw.percentage)
              const amountUSD = parseFloat(withdraw.amountUSD)
              const formattedAmount = amountUSD.toFixed(2)

              allTransactions.push({
                type: 'withdraw',
                id: withdraw.id,
                fundId: withdraw.fundId,
                user: withdraw.investor,
                amount: `${percentage.toFixed(0)}%`,
                details: `Withdrew ${percentage.toFixed(2)}% ($${formattedAmount} USD)`,
                timestamp: parseInt(withdraw.blockTimestamp),
                transactionHash: withdraw.transactionHash,
                symbol: '%',
              })
            }
          })
        }

        // Process withdraw fees
        if (data.withdrawFees && Array.isArray(data.withdrawFees)) {
          data.withdrawFees.forEach((fee) => {
            // Format amount to max 6 decimal places
            const formattedAmount = parseFloat(fee.amount).toFixed(6).replace(/\.?0+$/, '')
            
            allTransactions.push({
              type: 'withdrawFee',
              id: fee.id,
              fundId: fee.fundId,
              user: fee.manager,
              amount: formattedAmount, // Only amount, no symbol, max 6 decimals
              details: `Withdraw Fee Collected (${fee.symbol})`,
              timestamp: parseInt(fee.blockTimestamp),
              transactionHash: fee.transactionHash,
              token: fee.token,
              symbol: fee.symbol,
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