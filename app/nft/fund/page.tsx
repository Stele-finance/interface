"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ImageIcon, Trophy, TrendingUp, ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

export default function NFTFundPage() {
  const { t } = useLanguage()
  const { network: walletNetwork } = useWallet()
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [isLoading, setIsLoading] = useState(false)

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Save network selection to localStorage when it changes
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
  }

  // Simulate loading state for UI consistency
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedNetwork])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Fund Manager NFTs</h1>
          </div>

          {/* Network Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="p-3 bg-transparent border-gray-600 hover:bg-gray-700">
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-muted/80 border-gray-600">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleNetworkChange('ethereum')}
              >
                <Image
                  src="/networks/small/ethereum.png"
                  alt="Ethereum"
                  width={16}
                  height={16}
                  className="rounded-full mr-2"
                />
                Ethereum
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleNetworkChange('arbitrum')}
              >
                <Image
                  src="/networks/small/arbitrum.png"
                  alt="Arbitrum"
                  width={16}
                  height={16}
                  className="rounded-full mr-2"
                />
                Arbitrum
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground">
          View all Manager NFTs earned by fund managers, showcasing their portfolio achievements
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden bg-muted/30 border border-gray-700/50">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Manager NFTs Found</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create and manage funds to earn exclusive Manager NFTs!
            These NFTs represent your achievements as a fund manager.
          </p>
        </div>
      )}
    </div>
  )
}