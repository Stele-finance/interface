'use client'

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { RecentChallengesTable } from "./RecentChallengesTable"
import Image from "next/image"

interface TotalChallengesTabProps {
  activeTab: 'portfolio' | 'challenges'
  setActiveTab: (tab: 'portfolio' | 'challenges') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function TotalChallengesTab({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }: TotalChallengesTabProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4 mt-8">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('myChallenge')}
          </button>
          <h2 className="text-3xl text-gray-100 cursor-default">{t('totalChallenges')}</h2>
        </div>
        <div className="flex items-center gap-3">
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
                onClick={() => setSelectedNetwork('ethereum')}
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
                onClick={() => setSelectedNetwork('arbitrum')}
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
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            {t('myChallenge')}
          </button>
          <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('totalChallenges')}</h2>
        </div>
        
        {/* Network Dropdown */}
        <div className="flex items-center gap-3">
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
                onClick={() => setSelectedNetwork('ethereum')}
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
                onClick={() => setSelectedNetwork('arbitrum')}
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
      </div>

      <RecentChallengesTable selectedNetwork={selectedNetwork} />
    </div>
  )
}