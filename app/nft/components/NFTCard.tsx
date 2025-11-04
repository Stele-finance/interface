"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { NETWORK_CONTRACTS } from "@/lib/constants"

interface NFTCardProps {
  nft: {
    id: string
    tokenId: string
    challengeId: string
    challengeType: number
    user: string
    totalUsers: number
    rank: number
    seedMoney: string
    finalScore: string
    returnRate: string
    returnRateFormatted: string
    profitLossPercent: number
    dateFormatted: string
    timestampFormatted: string
    rankSuffix: string
    challengePeriod: string
    imagePath: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }
  network?: 'ethereum' | 'arbitrum'
}

export function NFTCard({ nft, network = 'ethereum' }: NFTCardProps) {
  const router = useRouter()

  const getNFTExplorerUrl = () => {
    // Use network_fund key format for NETWORK_CONTRACTS
    const networkKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
    const nftAddress = NETWORK_CONTRACTS[networkKey].STELE_FUND_NFT_ADDRESS
    const baseUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'
    return `${baseUrl}/nft/${nftAddress}/${nft.tokenId}`
  }

  const handleCardClick = () => {
    router.push(`/challenge/${network}/${nft.challengeId}/${nft.user}`)
  }

  // Format profit/loss percent (17 -> 0.17%)
  const formatReturnRate = (profitLossPercent: number) => {
    const percentValue = profitLossPercent / 100
    const sign = percentValue >= 0 ? "+" : ""
    return `${sign}${percentValue.toFixed(2)}%`
  }

  const getReturnRateColor = (profitLossPercent: number) => {
    return profitLossPercent >= 0 ? "#10b981" : "#ef4444"
  }

  // Format USDC amount (6 decimals) - floor to integer dollars only
  const formatUSDC = (amount: string) => {
    const amountNum = parseFloat(amount)
    if (amountNum >= 1e12) { // >= 1,000,000 USD (1M)
      return `${Math.floor(amountNum / 1e12)}M`
    } else if (amountNum >= 1e11) { // >= 100,000 USD (100K)
      return `${Math.floor(amountNum / 1e9)}K`
    } else {
      // Return integer dollars only (floor)
      return `${Math.floor(amountNum / 1e6)}`
    }
  }

  const returnRateColor = getReturnRateColor(nft.profitLossPercent)
  const seedMoneyFormatted = formatUSDC(nft.seedMoney)
  const finalScoreFormatted = formatUSDC(nft.finalScore)

  const profitLoss = parseFloat(nft.finalScore) - parseFloat(nft.seedMoney)
  const profitLossFormatted = formatUSDC(Math.abs(profitLoss).toString())

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
        Trading Performance
      </text>
      <text x="24" y="60" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" fill="#9ca3af">
        Stele Protocol
      </text>

      <rect x="24" y="85" width="80" height="32" rx="16" fill="url(#orangeGradient-${nft.id})"/>
      <text x="64" y="103" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
        Rank ${nft.rank}
      </text>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="140" font-size="14" font-weight="500" fill="#9ca3af">Challenge</text>
        <text x="276" y="140" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">#${nft.challengeId}</text>

        <text x="24" y="165" font-size="14" font-weight="500" fill="#9ca3af">Duration</text>
        <text x="276" y="165" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">${nft.challengePeriod}</text>

        <text x="24" y="190" font-size="14" font-weight="500" fill="#9ca3af">Ranking</text>
        <text x="276" y="190" font-size="14" font-weight="600" fill="url(#orangeGradient-${nft.id})" text-anchor="end">${nft.rank}${nft.rankSuffix} / ${nft.totalUsers}</text>

        <text x="24" y="215" font-size="14" font-weight="500" fill="#9ca3af">Return Rate</text>
        <text x="276" y="215" font-size="16" font-weight="700" fill="${returnRateColor}" text-anchor="end">${formatReturnRate(nft.profitLossPercent)}</text>
      </g>

      <line x1="24" y1="245" x2="276" y2="245" stroke="#404040" stroke-width="1"/>

      <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
        <text x="24" y="270" font-size="14" font-weight="500" fill="#9ca3af">Initial Investment</text>
        <text x="276" y="270" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">$${seedMoneyFormatted}</text>

        <text x="24" y="295" font-size="14" font-weight="500" fill="#9ca3af">Current Value</text>
        <text x="276" y="295" font-size="14" font-weight="600" fill="#f9fafb" text-anchor="end">$${finalScoreFormatted}</text>

        <text x="24" y="320" font-size="14" font-weight="500" fill="#9ca3af">Profit/Loss</text>
        <text x="276" y="320" font-size="14" font-weight="600" fill="${returnRateColor}" text-anchor="end">${profitLoss >= 0 ? '+' : '-'}$${profitLossFormatted}</text>
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
          onClick={handleCardClick}
          className="w-full aspect-[3/4] flex items-center justify-center cursor-pointer"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </CardHeader>
      <CardContent className="pt-4">
        <a
          href={getNFTExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="font-mono">
            Token ID: {nft.tokenId}
          </span>
        </a>
      </CardContent>
    </Card>
  )
}