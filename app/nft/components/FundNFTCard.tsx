"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Hash } from "lucide-react"

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
    fundCreatedFormatted: string
    mintedAtFormatted: string
    transactionHash: string
  }
  network?: 'ethereum' | 'arbitrum'
}

export function FundNFTCard({ nft, network = 'ethereum' }: FundNFTCardProps) {
  const getExplorerUrl = (txHash: string) => {
    const baseUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  // Format return rate (matches smart contract formatReturnRate)
  const formatReturnRate = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    const sign = rate >= 0 ? "+" : "-"
    const absRate = Math.abs(rate)
    const whole = Math.floor(absRate)
    const decimals = Math.floor((absRate - whole) * 100)
    const decimalsStr = decimals < 10 ? `0${decimals}` : `${decimals}`
    return `${sign}${whole}.${decimalsStr}%`
  }

  const getReturnRateSVGColor = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    return rate >= 0 ? "#10b981" : "#ef4444"
  }

  // Format USDC amount (matches smart contract formatAmount)
  const formatAmount = (amount: string) => {
    const amountNum = parseFloat(amount)
    const ONE_USDC = 1e6
    const millionTokens = ONE_USDC * 1e6
    const thousandTokens = ONE_USDC * 1e3

    if (amountNum >= millionTokens) { // >= 1M USDC
      const whole = Math.floor(amountNum / millionTokens)
      const fraction = Math.floor((amountNum % millionTokens) / (millionTokens / 100))
      const fractionStr = fraction < 10 ? `0${fraction}` : `${fraction}`
      return `$${whole}.${fractionStr}M`
    } else if (amountNum >= thousandTokens) { // >= 1K USDC
      const whole = Math.floor(amountNum / thousandTokens)
      const fraction = Math.floor((amountNum % thousandTokens) / (thousandTokens / 100))
      const fractionStr = fraction < 10 ? `0${fraction}` : `${fraction}`
      return `$${whole}.${fractionStr}K`
    } else if (amountNum >= ONE_USDC) { // >= 1 USDC
      const whole = Math.floor(amountNum / ONE_USDC)
      const fraction = Math.floor((amountNum % ONE_USDC) / (ONE_USDC / 100))
      const fractionStr = fraction < 10 ? `0${fraction}` : `${fraction}`
      return `$${whole}.${fractionStr}`
    } else if (amountNum === 0) {
      return '$0.00'
    } else {
      // Less than 1 USDC
      const fraction = Math.floor((amountNum * 100) / ONE_USDC)
      const fractionStr = fraction < 10 ? `0${fraction}` : `${fraction}`
      return `$0.${fractionStr}`
    }
  }

  // Format address (matches smart contract addressToString - 0x1234...)
  const formatAddressShort = (address: string) => {
    return `${address.slice(0, 10)}...`
  }

  // Calculate profit
  const investment = parseFloat(nft.investment)
  const currentValue = parseFloat(nft.currentTVL)
  const returnRate = parseFloat(nft.returnRateFormatted)

  const profit = returnRate >= 0 ? currentValue - investment : investment - currentValue
  const profitSign = returnRate >= 0 ? "+" : "-"
  const profitColor = returnRate >= 0 ? "#10b981" : "#ef4444"
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
        <filter id="cardShadow-${nft.id}">
          <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000" flood-opacity="0.06"/>
        </filter>
      </defs>

      <rect width="300" height="400" rx="12" fill="url(#cardBackground-${nft.id})" stroke="#404040" stroke-width="1" filter="url(#cardShadow-${nft.id})"/>
      <rect x="0" y="0" width="300" height="4" rx="12" fill="url(#orangeGradient-${nft.id})"/>

      <text x="24" y="40" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="600" fill="#f9fafb">
        Fund Performance
      </text>
      <text x="24" y="60" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" fill="#9ca3af">
        Stele Protocol
      </text>

      <rect x="24" y="85" width="80" height="32" rx="16" fill="url(#orangeGradient-${nft.id})"/>
      <text x="64" y="103" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
        Fund #${nft.fundId}
      </text>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="140" font-size="14" font-weight="500" fill="#9ca3af">Fund ID</text>
        <text x="276" y="140" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">#${nft.fundId}</text>

        <text x="24" y="165" font-size="14" font-weight="500" fill="#9ca3af">Manager</text>
        <text x="276" y="165" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${formatAddressShort(nft.manager)}</text>

        <text x="24" y="190" font-size="14" font-weight="500" fill="#9ca3af">Created</text>
        <text x="276" y="190" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.fundCreatedFormatted}</text>

        <text x="24" y="215" font-size="14" font-weight="500" fill="#9ca3af">Minted</text>
        <text x="276" y="215" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.mintedAtFormatted}</text>

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
        <text x="276" y="345" font-size="14" font-weight="600" fill="${profitColor}" text-anchor="end">${profitSign}${formatAmount(profit.toString())}</text>
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
