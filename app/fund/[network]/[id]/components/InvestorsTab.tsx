import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Loader2, Users, FolderOpen, Crown } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { formatDateOnly } from "@/lib/utils"

interface InvestorsTabProps {
  challengeId: string // Will represent fundId
  subgraphNetwork: string
  routeNetwork: string
  useFundInvestors: any // Hook for fetching fund investors
  fundData?: any // Fund data for stake calculation
}


export function InvestorsTab({ challengeId, subgraphNetwork, routeNetwork, useFundInvestors, fundData }: InvestorsTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxPages = 5
  
  // Use real fund investors data from subgraph
  const { data: investorData = [], isLoading: isLoadingInvestors, error: investorsError } = useFundInvestors(
    challengeId,
    subgraphNetwork as 'ethereum' | 'arbitrum'
  )

  // Helper function to format date
  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    return formatDateOnly(date, language)
  }

  // Helper function to format USD value
  const formatUSD = (value: string) => {
    const num = parseFloat(value)
    const truncated = Math.floor(num * 100) / 100
    return `$${truncated.toFixed(2)}`
  }

  // Helper function to calculate stake percentage
  const calculateStake = (investorShare: string) => {
    if (!fundData?.fund?.share || !investorShare) return '0.00%'
    const investorShareNum = parseFloat(investorShare)
    const fundShareNum = parseFloat(fundData.fund.share)
    if (fundShareNum === 0) return '0.00%'
    const percentage = (investorShareNum / fundShareNum) * 100
    return `${percentage.toFixed(2)}%`
  }

  // Sort data to show manager first, then investors by amount
  const sortedInvestorData = [...investorData].sort((a: any, b: any) => {
    // Manager always comes first
    if (a.isManager && !b.isManager) return -1
    if (!a.isManager && b.isManager) return 1
    // Among non-managers, sort by amount (highest first)
    return parseFloat(b.amountUSD) - parseFloat(a.amountUSD)
  })

  // Helper function to format user address
  const formatUserAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Helper function to handle wallet click
  const handleWalletClick = (walletAddress: string) => {
    router.push(`/fund/${routeNetwork}/${challengeId}/${walletAddress}`)
  }

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {isLoadingInvestors ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-gray-400">{t('loading')}...</span>
          </div>
        ) : investorsError ? (
          <div className="text-center py-8 text-red-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Error loading investors</p>
            <p className="text-sm text-gray-400 mt-2">Please try again later</p>
          </div>
        ) : sortedInvestorData.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">Stake</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('updated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Calculate pagination using sorted data
                      const totalInvestors = Math.min(sortedInvestorData.length, maxPages * itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = Math.min(startIndex + itemsPerPage, totalInvestors);
                      const paginatedInvestors = sortedInvestorData.slice(startIndex, endIndex);

                      return paginatedInvestors.map((investor: any, index: number) => (
                        <tr 
                          key={investor.id} 
                          className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                          onClick={() => handleWalletClick(investor.investor)}
                        >
                          {/* Wallet column */}
                          <td className="py-6 pl-6 pr-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* Manager crown or ranking badge */}
                              <div className="flex items-center gap-2">
                                {investor.isManager ? (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <span className="text-sm text-gray-400 font-medium min-w-[20px]">
                                    {startIndex + index + (sortedInvestorData.some((inv: any) => inv.isManager) ? 0 : 1)}
                                  </span>
                                )}
                              </div>
                              {/* Wallet address */}
                              <div className="flex items-center gap-2">
                                <div className={`text-sm hover:text-blue-400 transition-colors ${
                                  investor.isManager ? 'text-yellow-300 font-medium' : 'text-gray-300'
                                }`}>
                                  {formatUserAddress(investor.investor)}
                                </div>
                                {investor.isManager && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-yellow-500 text-yellow-400 bg-yellow-500/10">
                                    Manager
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Current USD column */}
                          <td className="py-6 px-4 whitespace-nowrap">
                            <div className="font-medium text-gray-100">
                              {formatUSD(investor.amountUSD)}
                            </div>
                          </td>

                          {/* Stake column */}
                          <td className="py-6 px-4 whitespace-nowrap">
                            <div className="font-medium text-blue-400">
                              {calculateStake(investor.share)}
                            </div>
                          </td>

                          {/* Updated column */}
                          <td className="py-6 px-6 whitespace-nowrap">
                            <div className="text-right text-sm text-gray-400">
                              {formatDate(investor.updatedAtTimestamp)}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination - outside scrollable area, fixed at bottom */}
            {(() => {
              const totalInvestors = Math.min(sortedInvestorData.length, maxPages * itemsPerPage);
              const totalPages = Math.min(Math.ceil(totalInvestors / itemsPerPage), maxPages);
              
              return totalPages > 1 && (
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
              );
            })()}
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noInvestorsFound')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 