'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { formatDateWithLocale } from "@/lib/utils"
import {
  ChevronDown,
  Coins,
  Users,
  DollarSign,
  Loader2
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useFunds } from "@/app/dashboard/fund/hooks/useFunds"
import Image from "next/image"

interface TotalFundsTabProps {
  activeTab: 'my-funds' | 'all-funds'
  setActiveTab: (tab: 'my-funds' | 'all-funds') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function TotalFundsTab({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }: TotalFundsTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)

  // Use real fund data from GraphQL
  const { data: fundsData, isLoading, error } = useFunds(100, selectedNetwork)
  const funds = fundsData?.funds || []

  // Handle click outside for network dropdown
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false)
      }
    }

    if (showNetworkDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [showNetworkDropdown])

  // Helper function to format USD values
  const formatUSD = (value: string) => {
    const num = parseFloat(value)
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  // Fund Table Row Component
  const FundRow = ({ fund }: { fund: any }) => {
    const handleRowClick = () => {
      router.push(`/fund/${selectedNetwork}/${fund.fundId}`)
    }

    return (
      <tr
        className="hover:bg-gray-800/30 transition-colors cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="py-6 pl-6 pr-4 min-w-[100px] whitespace-nowrap">
          <div className="ml-6">
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap hover:bg-gray-800 hover:text-gray-300 hover:border-gray-600">
              #{fund.fundId}
            </Badge>
          </div>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <span className="font-medium text-green-400">
            {formatUSD(fund.amountUSD)}
          </span>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-gray-100">
              {fund.investorCount}
            </span>
          </div>
        </td>
        <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
          <span className="text-sm text-gray-400">
            {formatDateTime(fund.createdAtTimestamp)}
          </span>
        </td>
      </tr>
    )
  }

  // Fund Table Component
  const FundTable = ({ funds }: { funds: any[] }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const maxPages = 5

    if (funds.length === 0) return null

    const totalFunds = Math.min(funds.length, maxPages * itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalFunds)
    const paginatedFunds = funds.slice(startIndex, endIndex)
    const totalPages = Math.min(Math.ceil(totalFunds / itemsPerPage), maxPages)

    return (
      <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-blue-500" />
                        {t('fund')}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">TVL</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('investor')}</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('create')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFunds.map((fund) => (
                    <FundRow key={fund.id} fund={fund} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center py-4 px-6 border-t border-gray-600">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer hover:bg-gray-700"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mt-8">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('my-funds')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('myFunds')}
          </button>
          <h2 className="text-3xl text-gray-100 cursor-default">{t('allFunds')}</h2>
        </div>
        <div className="flex items-center gap-3">
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
                    setSelectedNetwork('ethereum')
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
                    setSelectedNetwork('arbitrum')
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
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('my-funds')}
            className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            {t('myFunds')}
          </button>
          <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('allFunds')}</h2>
        </div>

        <div className="flex items-center gap-3">
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
                    setSelectedNetwork('ethereum')
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
                    setSelectedNetwork('arbitrum')
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
      </div>

      {/* Show funds table */}
      {isLoading ? (
        <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <th key={i} className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j} className="py-6 px-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {funds.length === 0 ? (
            <Card className="bg-muted border-gray-700/50">
              <CardContent className="text-center py-12">
                <Coins className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-100 mb-2">{t('noFundsFound')}</h3>
                <p className="text-gray-400">
                  {t('noActiveFundsAvailable')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <FundTable funds={funds} />
          )}
        </>
      )}
    </div>
  )
}
