'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { 
  getRPCUrl,
  getUniswapQuoterAddress,
  getUSDCTokenAddress,
  getWETHAddress,
} from '@/lib/constants'

// QuoterV2 ABI (simplified for price fetching)
const QUOTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
      {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
      {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export function useETHPrice(network: 'ethereum' | 'arbitrum' = 'ethereum') {
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchETHPrice = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const rpcUrl = getRPCUrl(network)
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const quoterAddress = getUniswapQuoterAddress(network)
        const usdcAddress = getUSDCTokenAddress(network)
        const wethAddress = getWETHAddress(network)

        // Create quoter contract instance
        const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider)

        // Quote 1 WETH to USDC
        const amountIn = ethers.parseEther('1') // 1 ETH
        const fee = 3000 // 0.3% fee tier (most common)

        const params = {
          tokenIn: wethAddress,
          tokenOut: usdcAddress,
          amountIn: amountIn,
          fee: fee,
          sqrtPriceLimitX96: 0
        }

        // Get quote from Uniswap
        const [amountOut] = await quoter.quoteExactInputSingle.staticCall(params)
        
        // USDC has 6 decimals
        const price = Number(amountOut) / 1e6
        
        setEthPrice(price)
      } catch (err) {
        console.error('Error fetching ETH price:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch ETH price')
        // Set a fallback price if fetch fails
        setEthPrice(3500) // Fallback ETH price
      } finally {
        setIsLoading(false)
      }
    }

    fetchETHPrice()
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchETHPrice, 30000)
    
    return () => clearInterval(interval)
  }, [network])

  return { ethPrice, isLoading, error }
}