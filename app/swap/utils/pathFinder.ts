import { ethers } from "ethers"
import {
  getRPCUrl,
  getUniswapQuoterAddress,
  getWETHAddress
} from "@/lib/constants"

// QuoterV2 ABI - single hop and multi hop
const QUOTER_V2_ABI = [
  // Single hop
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
  },
  // Multi hop
  {
    "inputs": [
      {"internalType": "bytes", "name": "path", "type": "bytes"},
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"}
    ],
    "name": "quoteExactInput",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]"},
      {"internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]"},
      {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export interface SwapPath {
  swapType: number // 0 = single-hop, 1 = multi-hop
  path: string // Encoded path for multi-hop, "0x" for single-hop
  fee: number // Fee tier for single-hop
  amountOut: bigint
  gasEstimate: bigint
  route: string[] // Human-readable route
}

/**
 * Encode Uniswap V3 path
 * Format: tokenA (20 bytes) + fee (3 bytes) + tokenB (20 bytes) + ...
 */
function encodePath(tokens: string[], fees: number[]): string {
  if (tokens.length !== fees.length + 1) {
    throw new Error('Invalid path: tokens.length must be fees.length + 1')
  }

  let path = '0x'
  for (let i = 0; i < fees.length; i++) {
    // Add token address (remove 0x prefix)
    path += tokens[i].slice(2).toLowerCase()
    // Add fee (3 bytes = 6 hex chars)
    path += fees[i].toString(16).padStart(6, '0')
  }
  // Add last token
  path += tokens[tokens.length - 1].slice(2).toLowerCase()

  return path
}

/**
 * Try single-hop swap path
 */
async function trySingleHop(
  provider: ethers.JsonRpcProvider,
  quoterAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  feeTiers: number[] = [500, 3000, 10000]
): Promise<SwapPath | null> {
  const quoter = new ethers.Contract(quoterAddress, QUOTER_V2_ABI, provider)
  let bestPath: SwapPath | null = null

  for (const fee of feeTiers) {
    try {
      const params = {
        tokenIn: ethers.getAddress(tokenIn),
        tokenOut: ethers.getAddress(tokenOut),
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0
      }

      const result = await quoter.quoteExactInputSingle.staticCall(params)
      const amountOut = result[0]
      const gasEstimate = result[3]

      if (amountOut > BigInt(0) && (!bestPath || amountOut > bestPath.amountOut)) {
        bestPath = {
          swapType: 0, // EXACT_INPUT_SINGLE_HOP
          path: "0x",
          fee: fee,
          amountOut: amountOut,
          gasEstimate: gasEstimate,
          route: [tokenIn, tokenOut]
        }
      }
    } catch (error) {
      // Pool doesn't exist for this fee tier, continue
      continue
    }
  }

  return bestPath
}

/**
 * Try multi-hop swap path through WETH as intermediate token
 */
async function tryMultiHopThroughWETH(
  provider: ethers.JsonRpcProvider,
  quoterAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  wethAddress: string,
  feeTiers: number[] = [500, 3000, 10000]
): Promise<SwapPath | null> {
  const quoter = new ethers.Contract(quoterAddress, QUOTER_V2_ABI, provider)
  let bestPath: SwapPath | null = null

  // Try different fee tier combinations through WETH
  for (const fee1 of feeTiers) {
    for (const fee2 of feeTiers) {
      try {
        const tokens = [tokenIn, wethAddress, tokenOut]
        const fees = [fee1, fee2]
        const path = encodePath(tokens, fees)

        const result = await quoter.quoteExactInput.staticCall(path, amountIn)
        const amountOut = result[0]
        const gasEstimate = result[3]

        if (amountOut > BigInt(0) && (!bestPath || amountOut > bestPath.amountOut)) {
          bestPath = {
            swapType: 1, // EXACT_INPUT_MULTI_HOP
            path: path,
            fee: 0, // Not used for multi-hop
            amountOut: amountOut,
            gasEstimate: gasEstimate,
            route: tokens
          }
        }
      } catch (error) {
        // Route doesn't exist, continue
        continue
      }
    }
  }

  return bestPath
}

/**
 * Find the best swap path
 * - If both tokens are not WETH: Force multi-hop through WETH
 * - Otherwise: Compare single-hop and multi-hop to select the best
 *
 * @param fromTokenAddress - Input token address
 * @param toTokenAddress - Output token address
 * @param amountIn - Input amount (in wei)
 * @param network - Network ('ethereum' or 'arbitrum')
 * @returns Best swap path info, or null if not found
 */
export async function findBestSwapPath(
  fromTokenAddress: string,
  toTokenAddress: string,
  amountIn: bigint,
  network: 'ethereum' | 'arbitrum' = 'ethereum',
  fromTokenDecimals: number = 18,
  toTokenDecimals: number = 18,
  fromTokenSymbol: string = 'TOKEN',
  toTokenSymbol: string = 'TOKEN'
): Promise<SwapPath | null> {
  try {
    const provider = new ethers.JsonRpcProvider(getRPCUrl(network))
    const quoterAddress = getUniswapQuoterAddress(network)
    const wethAddress = getWETHAddress(network)

    // Check if either token is WETH
    const isFromWeth = fromTokenAddress.toLowerCase() === wethAddress.toLowerCase()
    const isToWeth = toTokenAddress.toLowerCase() === wethAddress.toLowerCase()
    const shouldForceMultiHop = !isFromWeth && !isToWeth

    console.log(`Finding route: ${fromTokenSymbol} -> ${toTokenSymbol}`)
    console.log(`Should force multi-hop through WETH: ${shouldForceMultiHop}`)

    const allPaths: SwapPath[] = []

    if (shouldForceMultiHop) {
      // Force multi-hop through WETH (e.g., LINK -> WETH -> WBTC)
      console.log(`Forcing multi-hop through WETH...`)
      const multiHopPath = await tryMultiHopThroughWETH(
        provider,
        quoterAddress,
        fromTokenAddress,
        toTokenAddress,
        amountIn,
        wethAddress
      )
      if (multiHopPath) {
        allPaths.push(multiHopPath)
        console.log(`Multi-hop path found: ${fromTokenSymbol} -> WETH -> ${toTokenSymbol}`)
        console.log(`Expected output: ${ethers.formatUnits(multiHopPath.amountOut, toTokenDecimals)} ${toTokenSymbol}`)
      }

      // Also try single-hop as fallback (in case direct pool has better liquidity)
      const singleHopPath = await trySingleHop(
        provider,
        quoterAddress,
        fromTokenAddress,
        toTokenAddress,
        amountIn
      )
      if (singleHopPath) {
        allPaths.push(singleHopPath)
        console.log(`Single-hop path also available: ${fromTokenSymbol} -> ${toTokenSymbol}`)
        console.log(`Expected output: ${ethers.formatUnits(singleHopPath.amountOut, toTokenDecimals)} ${toTokenSymbol}`)
      }
    } else {
      // One of tokens is WETH - prefer single-hop
      console.log(`One token is WETH, trying single-hop first...`)
      const singleHopPath = await trySingleHop(
        provider,
        quoterAddress,
        fromTokenAddress,
        toTokenAddress,
        amountIn
      )
      if (singleHopPath) {
        allPaths.push(singleHopPath)
        console.log(`Single-hop path found: ${fromTokenSymbol} -> ${toTokenSymbol}`)
        console.log(`Expected output: ${ethers.formatUnits(singleHopPath.amountOut, toTokenDecimals)} ${toTokenSymbol}`)
      }
    }

    // Select best path (highest output amount)
    if (allPaths.length === 0) {
      console.warn('No valid swap path found')
      return null
    }

    const bestPath = allPaths.reduce((best, current) =>
      current.amountOut > best.amountOut ? current : best
    )

    console.log(`✓ Best path selected: ${bestPath.swapType === 0 ? 'Single-hop' : 'Multi-hop'}`)
    console.log(`✓ Expected output: ${ethers.formatUnits(bestPath.amountOut, toTokenDecimals)} ${toTokenSymbol}`)

    return bestPath
  } catch (error) {
    console.error('Error finding best swap path:', error)
    return null
  }
}

/**
 * Generate human-readable description of swap route
 */
export function formatSwapRoute(path: SwapPath, getTokenSymbol: (address: string) => string): string {
  const symbols = path.route.map(addr => getTokenSymbol(addr))

  if (path.swapType === 0) {
    return `${symbols[0]} → ${symbols[1]} (${path.fee / 10000}% fee)`
  } else {
    return symbols.join(' → ')
  }
}
