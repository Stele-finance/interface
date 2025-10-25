"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Hash, Wallet } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"
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
    imagePath: string
    fundCreated: string
    mintedAt: string
    lastUpdatedAt: string
    transferCount: string
  }
}

export function FundNFTCard({ nft }: FundNFTCardProps) {
  const { t } = useLanguage()

  const getReturnRateColor = (returnRate: string) => {
    const rate = parseFloat(returnRate)
    if (rate > 0) return "text-green-500"
    if (rate < 0) return "text-red-500"
    return "text-gray-500"
  }

  const formatEther = (value: string) => {
    try {
      return parseFloat(ethers.formatEther(value)).toFixed(2)
    } catch {
      return "0.00"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="relative">
          <Image
            src={nft.imagePath}
            alt={`Fund Manager NFT #${nft.tokenId}`}
            width={300}
            height={200}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = "/nft/fund/1st.png"
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-blue-50 font-bold">
              <Wallet className="h-3 w-3 mr-1" />
              Manager
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">
            Manager NFT #{nft.tokenId}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            Fund #{nft.fundId}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {nft.manager.slice(0, 6)}...{nft.manager.slice(-4)}
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
              <p className="text-muted-foreground">Minted</p>
              <p className="font-semibold">{nft.dateFormatted}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <div>
            <p className="text-muted-foreground text-xs">Investment</p>
            <p className="font-semibold">{formatEther(nft.investment)} ETH</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current TVL</p>
            <p className="font-semibold">{formatEther(nft.currentTVL)} ETH</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="font-mono">
              Transfers: {nft.transferCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
