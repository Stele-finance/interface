'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
  Coins,
  Users
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useFunds } from "@/app/fund/hooks/useFunds"
import { useFundSnapshots } from "@/app/fund/hooks/useFundSnapshots"
import { SparklineChart } from "@/components/SparklineChart"

interface TotalFundsTabProps {
  activeTab: 'my-funds' | 'all-funds'
  setActiveTab: (tab: 'my-funds' | 'all-funds') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function TotalFundsTab({ activeTab, setActiveTab, selectedNetwork }: TotalFundsTabProps) {
  const { t } = useLanguage()
  const router = useRouter()

  // Use real fund data from GraphQL
  const { data: fundsData, isLoading } = useFunds(100, selectedNetwork)
  const funds = fundsData?.funds || []

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

  // Format profit ratio
  const formatProfitRatio = (ratio: string) => {
    const num = parseFloat(ratio)
    if (isNaN(num)) return '+0.00%'
    const percentage = (num * 100).toFixed(2)
    return num >= 0 ? `+${percentage}%` : `${percentage}%`
  }

  // Fund Table Row Component
  const FundRow = ({ fund }: { fund: any }) => {
    const handleRowClick = () => {
      router.push(`/fund/${selectedNetwork}/${fund.fundId}`)
    }

    const profitRatio = parseFloat(fund.profitRatio)
    const isPositive = profitRatio >= 0

    // Fetch daily snapshots for the chart
    const { data: snapshotsData } = useFundSnapshots(fund.fundId, selectedNetwork)
    const snapshots = snapshotsData?.dailySnapshots || []

    // Transform snapshot data for the chart (reverse to show oldest to newest)
    const chartData = snapshots
      .slice()
      .reverse()
      .map(snapshot => ({
        value: parseFloat(snapshot.amountUSD)
      }))

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
        <td className="py-6 px-4 min-w-[120px] whitespace-nowrap">
          <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {formatProfitRatio(fund.profitRatio)}
          </span>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <span className="font-medium text-green-400">
            {formatUSD(fund.amountUSD)}
          </span>
        </td>
        <td className="py-6 px-4 min-w-[140px]">
          <div className="w-32">
            {chartData.length > 0 ? (
              <SparklineChart data={chartData} height={40} />
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-gray-500">
                No data
              </div>
            )}
          </div>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-gray-100">
              {fund.investorCount}
            </span>
          </div>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('profitRatio')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">TVL</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">Chart</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('investor')}</th>
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
      </div>

      {/* Show funds table */}
      {isLoading ? (
        <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <th key={i} className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      {[1, 2, 3, 4, 5].map((j) => (
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
