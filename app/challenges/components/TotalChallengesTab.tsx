'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [showMobileNetworkDropdown, setShowMobileNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)
  const mobileNetworkDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false)
      }
      if (mobileNetworkDropdownRef.current && !mobileNetworkDropdownRef.current.contains(event.target as Node)) {
        setShowMobileNetworkDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

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
          <div className="relative" ref={networkDropdownRef}>
            <Button
              variant="outline"
              size="lg"
              className="p-3 bg-transparent border-gray-600 hover:bg-gray-700"
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
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
            </Button>
            {showNetworkDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <div
                  className="cursor-pointer p-2 hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setSelectedNetwork('ethereum')
                    setShowNetworkDropdown(false)
                  }}
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </div>
                <div
                  className="cursor-pointer p-2 hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setSelectedNetwork('arbitrum')
                    setShowNetworkDropdown(false)
                  }}
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </div>
              </div>
            )}
          </div>
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
          <div className="relative" ref={mobileNetworkDropdownRef}>
            <Button
              variant="outline"
              size="lg"
              className="p-3 bg-transparent border-gray-600 hover:bg-gray-700"
              onClick={() => setShowMobileNetworkDropdown(!showMobileNetworkDropdown)}
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
            </Button>
            {showMobileNetworkDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <div
                  className="cursor-pointer p-2 hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setSelectedNetwork('ethereum')
                    setShowMobileNetworkDropdown(false)
                  }}
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </div>
                <div
                  className="cursor-pointer p-2 hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setSelectedNetwork('arbitrum')
                    setShowMobileNetworkDropdown(false)
                  }}
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RecentChallengesTable selectedNetwork={selectedNetwork} />
    </div>
  )
}