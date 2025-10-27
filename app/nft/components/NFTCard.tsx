"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Hash } from "lucide-react"

interface NFTCardProps {
  nft: {
    id: string
    tokenId: string
    challengeId: string
    user: string
    rank: number
    returnRate: string
    returnRateFormatted: string
    dateFormatted: string
    timestampFormatted: string
    rankSuffix: string
    imagePath: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }
  network?: 'ethereum' | 'arbitrum'
}

export function NFTCard({ nft, network = 'ethereum' }: NFTCardProps) {
  const getExplorerUrl = (txHash: string) => {
    const baseUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  const formatReturnRate = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    const sign = rate >= 0 ? "+" : ""
    return `${sign}${rate.toFixed(2)}%`
  }

  const getReturnRateSVGColor = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    return rate >= 0 ? "#10b981" : "#ef4444"
  }

  const formatAddressShort = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
        Trading Performance
      </text>
      <text x="24" y="60" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" fill="#9ca3af">
        Stele Protocol
      </text>

      <rect x="24" y="85" width="80" height="32" rx="16" fill="url(#orangeGradient-${nft.id})"/>
      <text x="64" y="105" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
        Rank ${nft.rank}
      </text>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="140" font-size="14" font-weight="500" fill="#9ca3af">Challenge</text>
        <text x="276" y="140" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">#${nft.challengeId}</text>

        <text x="24" y="165" font-size="14" font-weight="500" fill="#9ca3af">Token ID</text>
        <text x="276" y="165" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">#${nft.tokenId}</text>

        <text x="24" y="190" font-size="14" font-weight="500" fill="#9ca3af">Ranking</text>
        <text x="276" y="190" font-size="14" font-weight="600" fill="url(#orangeGradient-${nft.id})" text-anchor="end">${nft.rank}${nft.rankSuffix}</text>

        <text x="24" y="215" font-size="14" font-weight="500" fill="#9ca3af">Return Rate</text>
        <text x="276" y="215" font-size="16" font-weight="700" fill="${returnRateColor}" text-anchor="end">${formatReturnRate(nft.returnRateFormatted)}</text>
      </g>

      <line x1="24" y1="245" x2="276" y2="245" stroke="#404040" stroke-width="1"/>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="270" font-size="14" font-weight="500" fill="#9ca3af">Owner</text>
        <text x="276" y="270" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${formatAddressShort(nft.user)}</text>

        <text x="24" y="295" font-size="14" font-weight="500" fill="#9ca3af">Minted</text>
        <text x="276" y="295" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.dateFormatted}</text>

        <text x="24" y="320" font-size="14" font-weight="500" fill="#9ca3af">Network</text>
        <text x="276" y="320" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${network === 'arbitrum' ? 'Arbitrum' : 'Ethereum'}</text>
      </g>

      <text x="150" y="365" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="500" fill="#9ca3af" text-anchor="middle">
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