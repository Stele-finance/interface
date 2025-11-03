"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, ChevronDown, Trophy, Coins } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormattedFundNFTData, useFormattedUserFundNFTData } from "../hooks/useFundNFTData"
import { FundNFTCard } from "../components/FundNFTCard"
import { useWallet } from "@/app/hooks/useWallet"

export default function NFTFundPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address } = useWallet()
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Listen for network changes from navbar
  useEffect(() => {
    const handleNetworkChanged = (event: CustomEvent) => {
      const { network } = event.detail
      if (network === 'ethereum' || network === 'arbitrum') {
        setSelectedNetwork(network)
      }
    }

    window.addEventListener('networkChanged', handleNetworkChanged as EventListener)

    return () => {
      window.removeEventListener('networkChanged', handleNetworkChanged as EventListener)
    }
  }, [])

  // Handle click outside for type dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [])

  // Fetch all NFTs
  const {
    nfts: allNfts,
    isLoading: isLoadingAll,
    error: errorAll,
    refetch: refetchAll
  } = useFormattedFundNFTData(selectedNetwork)

  // Fetch user's NFTs
  const {
    nfts: myNfts,
    isLoading: isLoadingMy,
    error: errorMy,
    refetch: refetchMy
  } = useFormattedUserFundNFTData(selectedNetwork, address)

  const renderNFTContent = (nfts: any[], isLoading: boolean, error: string | null, refetch: () => void) => {
    if (isLoading) {
      return (
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
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <ImageIcon className="mx-auto h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('errorLoadingTokens')}</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
        </div>
      )
    }

    if (nfts && nfts.length > 0) {
      return (
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
              <FundNFTCard key={nft.id} nft={nft} network={selectedNetwork} />
            ))}
          </div>
        </>
      )
    }

    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('noNFTsFound')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('noNFTsFoundDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('nft')}</h1>
          </div>

          {/* Challenge/Fund Type Selector Dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="px-2.5 py-2 bg-transparent hover:bg-gray-700 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">{t('fund')}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full mt-2 right-0 min-w-[130px] bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <button
                  onClick={() => {
                    router.push('/nft/challenge')
                    setShowTypeDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                  {t('challenge')}
                </button>
                <button
                  onClick={() => {
                    setShowTypeDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 bg-gray-700/30"
                >
                  <Coins className="h-4 w-4 mr-2 text-blue-400" />
                  {t('fund')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="myNfts" className="w-full">
        <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-8 mb-6">
          <TabsTrigger
            value="myNfts"
            className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {t('myNFTs')}
          </TabsTrigger>
          <TabsTrigger
            value="totalNfts"
            className="bg-transparent px-0 py-2 text-lg md:text-xl font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {t('totalNFTs')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="myNfts" className="mt-0">
          {renderNFTContent(myNfts, isLoadingMy, errorMy, refetchMy)}
        </TabsContent>

        <TabsContent value="totalNfts" className="mt-0">
          {renderNFTContent(allNfts, isLoadingAll, errorAll, refetchAll)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
