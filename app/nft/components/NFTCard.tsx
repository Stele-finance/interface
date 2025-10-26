"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Calendar, Hash } from "lucide-react"
import Image from "next/image"

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

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500 text-yellow-50" // Gold
      case 2: return "bg-gray-400 text-gray-50" // Silver
      case 3: return "bg-amber-600 text-amber-50" // Bronze
      case 4: return "bg-blue-500 text-blue-50"
      case 5: return "bg-purple-500 text-purple-50"
      default: return "bg-gray-500 text-gray-50"
    }
  }

  const getReturnRateColor = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    if (rate > 0) return "text-green-500"
    if (rate < 0) return "text-red-500"
    return "text-gray-500"
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="relative bg-black rounded-lg">
          <Image
            src={nft.imagePath}
            alt={`Performance NFT - ${nft.rank}${nft.rankSuffix} Place`}
            width={300}
            height={300}
            className="w-full h-auto object-contain rounded-lg"
            onError={(e) => {
              // Fallback to a default NFT image if the rank-specific image doesn't exist
              e.currentTarget.src = "/nft/challenge/5th.png"
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${getRankColor(nft.rank)} font-bold`}>
              <Trophy className="h-3 w-3 mr-1" />
              {nft.rank}{nft.rankSuffix}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">
            Performance NFT #{nft.tokenId}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            Challenge #{nft.challengeId}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {nft.user.slice(0, 6)}...{nft.user.slice(-4)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Return</p>
              <p className={`font-semibold ${getReturnRateColor(nft.returnRateFormatted)}`}>
                {parseFloat(nft.returnRateFormatted) > 0 ? '+' : ''}{nft.returnRateFormatted}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Earned</p>
              <p className="font-semibold">{nft.dateFormatted}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <a
            href={getExplorerUrl(nft.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Hash className="h-3 w-3" />
            <span className="font-mono">
              {nft.transactionHash.slice(0, 10)}...{nft.transactionHash.slice(-8)}
            </span>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}