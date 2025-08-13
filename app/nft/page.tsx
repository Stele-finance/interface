"use client"

import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Trophy, TrendingUp, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormattedNFTData } from "./hooks/useNFTData"
import { NFTCard } from "./components/NFTCard"

export default function NFTPage() {
  const { t } = useLanguage()
  const { network: walletNetwork } = useWallet()
  
  const { 
    nfts, 
    isLoading, 
    error,
    refetch 
  } = useFormattedNFTData(walletNetwork)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <ImageIcon className="mx-auto h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('errorLoadingTokens')}</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('totalNFTs')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('viewAllPerformanceNFTs')}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : nfts && nfts.length > 0 ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('totalNFTs')}: {nfts.length}
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {t('refresh')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('noNFTsFound')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('noNFTsFoundDescription')}
          </p>
        </div>
      )}
    </div>
  )
}