"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Hash } from "lucide-react"
import { ethers } from "ethers"

interface FundNFTCardProps {
  nft: {
    id: string
    tokenId: string
    fundId: string
    manager: string
    owner: string
    investment: string
    currentTVL: string
    returnRate: string
    returnRateFormatted: string
    dateFormatted: string
    timestampFormatted: string
    fundCreated: string
    mintedAt: string
    lastUpdatedAt: string
    transactionHash: string
  }
  network?: 'ethereum' | 'arbitrum'
}

export function FundNFTCard({ nft, network = 'ethereum' }: FundNFTCardProps) {
  const getExplorerUrl = (txHash: string) => {
    const baseUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  const formatReturnRate = (returnRate: string) => {
    // returnRate is already a percentage string from returnRateFormatted
    const rate = parseFloat(returnRate)
    const sign = rate >= 0 ? "+" : ""
    return `${sign}${rate.toFixed(2)}%`
  }

  const getReturnRateSVGColor = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    return rate >= 0 ? "#10b981" : "#ef4444"
  }

  const formatAmount = (amount: string) => {
    try {
      const value = parseFloat(ethers.formatUnits(amount, 6)) // USDC has 6 decimals
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`
      } else {
        return `$${value.toFixed(2)}`
      }
    } catch {
      return "$0.00"
    }
  }

  const formatAddressShort = (address: string) => {
    return `${address.slice(0, 6)}...`
  }

  const calculateProfit = () => {
    try {
      const currentValue = parseFloat(ethers.formatUnits(nft.currentTVL, 6))
      const investment = parseFloat(ethers.formatUnits(nft.investment, 6))
      return currentValue - investment
    } catch {
      return 0
    }
  }

  const formatProfitAmount = (profitValue: number) => {
    const absProfit = Math.abs(profitValue)
    if (absProfit >= 1000000) {
      return `$${(absProfit / 1000000).toFixed(2)}M`
    } else if (absProfit >= 1000) {
      return `$${(absProfit / 1000).toFixed(2)}K`
    } else {
      return `$${absProfit.toFixed(2)}`
    }
  }

  const profit = calculateProfit()
  const profitSign = profit >= 0 ? "+" : "-"
  const profitColor = profit >= 0 ? "#10b981" : "#ef4444"
  const returnRateColor = getReturnRateSVGColor(nft.returnRateFormatted)

  const svgContent = `
    <svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orangeGradient-${nft.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff8c42;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e55100;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardBackground-${nft.id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1f1f23;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="300" height="400" rx="12" fill="url(#cardBackground-${nft.id})" stroke="#404040" stroke-width="1"/>
      <rect x="0" y="0" width="300" height="4" rx="12" fill="url(#orangeGradient-${nft.id})"/>

      <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="600" fill="#f9fafb">
        Fund Performance
      </text>
      <text x="24" y="60" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" fill="#9ca3af">
        Stele Protocol
      </text>

      <rect x="24" y="85" width="${80 + nft.fundId.length * 4}" height="32" rx="16" fill="url(#orangeGradient-${nft.id})"/>
      <text x="${64 + nft.fundId.length * 2}" y="105" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
        Fund #${nft.fundId}
      </text>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="140" font-size="14" font-weight="500" fill="#9ca3af">Fund ID</text>
        <text x="276" y="140" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">#${nft.fundId}</text>

        <text x="24" y="165" font-size="14" font-weight="500" fill="#9ca3af">Manager</text>
        <text x="276" y="165" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${formatAddressShort(nft.manager)}</text>

        <text x="24" y="190" font-size="14" font-weight="500" fill="#9ca3af">Created</text>
        <text x="276" y="190" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.fundCreated}</text>

        <text x="24" y="215" font-size="14" font-weight="500" fill="#9ca3af">Minted</text>
        <text x="276" y="215" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.mintedAt}</text>

        <text x="24" y="240" font-size="14" font-weight="500" fill="#9ca3af">Return Rate</text>
        <text x="276" y="240" font-size="16" font-weight="700" fill="${returnRateColor}" text-anchor="end">${formatReturnRate(nft.returnRateFormatted)}</text>
      </g>

      <line x1="24" y1="270" x2="276" y2="270" stroke="#404040" stroke-width="1"/>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="295" font-size="14" font-weight="500" fill="#9ca3af">Investment</text>
        <text x="276" y="295" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${formatAmount(nft.investment)}</text>

        <text x="24" y="320" font-size="14" font-weight="500" fill="#9ca3af">Current Value</text>
        <text x="276" y="320" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${formatAmount(nft.currentTVL)}</text>

        <text x="24" y="345" font-size="14" font-weight="500" fill="#9ca3af">Profit</text>
        <text x="276" y="345" font-size="14" font-weight="600" fill="${profitColor}" text-anchor="end">${profitSign}${formatProfitAmount(profit)}</text>
      </g>

      <text x="150" y="380" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="500" fill="#9ca3af" text-anchor="middle">
        Powered by Stele Protocol
      </text>
    </svg>
  `

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-0 p-0">
        <div
          className="w-full aspect-[3/4] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </CardHeader>
      <CardContent className="pt-4">
        <a
          href={getExplorerUrl(nft.transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Hash className="h-3 w-3" />
          <span className="font-mono">
            {nft.transactionHash.slice(0, 10)}...{nft.transactionHash.slice(-8)}
          </span>
        </a>
      </CardContent>
    </Card>
  )
}
