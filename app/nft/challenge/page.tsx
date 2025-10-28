"use client"

import { useState, useEffect, useRef } from "react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Trophy, TrendingUp, Calendar, ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormattedNFTData } from "../hooks/useNFTData"
import { NFTCard } from "../components/NFTCard"
import Image from "next/image"

export default function NFTPage() {
  const { t } = useLanguage()
  const { network: walletNetwork } = useWallet()
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Handle click outside for network dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as any)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [])

  // Save network selection to localStorage when it changes
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
  }
  
  const { 
    nfts, 
    isLoading, 
    error,
    refetch 
  } = useFormattedNFTData(selectedNetwork)

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('totalNFTs')}</h1>
          </div>
          
          {/* Network Selector Dropdown */}
          <div className="relative" ref={networkDropdownRef}>
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="p-3 bg-transparent border border-gray-600 hover:bg-gray-700 rounded-md"
            >
              <div className="flex items-center gap-2">
                {selectedNetwork === 'arbitrum' ? (
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            {showNetworkDropdown && (
              <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <button
                  onClick={() => {
                    handleNetworkChange('ethereum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </button>
                <button
                  onClick={() => {
                    handleNetworkChange('arbitrum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </button>
              </div>
            )}
          </div>
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
              <NFTCard key={nft.id} nft={nft} network={selectedNetwork} />
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