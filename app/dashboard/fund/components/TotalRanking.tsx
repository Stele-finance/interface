'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useTotalRanking } from "../hooks/useTotalRanking"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface TotalRankingProps {
  className?: string
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
}

export function TotalRanking({ className, network }: TotalRankingProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxPages = 10
  
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  const { data: rankingData, isLoading, error } = useTotalRanking(subgraphNetwork)

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format challenge type
  const getChallengeType = (challengeId: string) => {
    return `${challengeId}`
  }

  // Format seed money (convert from BigInt to USD)
  const formatSeedMoney = (seedMoney: string) => {
    // Assuming seedMoney is in USDC (6 decimals)
    const amount = parseFloat(seedMoney) / 1e6
    return `$${amount.toFixed(2)}`
  }

  // Format profit ratio as percentage
  const formatProfitRatio = (profitRatio: string) => {
    const ratio = parseFloat(profitRatio)
    return `${ratio.toFixed(4)}%`
  }

  // Handle row click to navigate to investor page
  const handleRowClick = (challengeId: string, walletAddress: string) => {
    router.push(`/challenge/${subgraphNetwork}/${challengeId}/${walletAddress}`)
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <h2 className="text-3xl text-gray-100">{t('hallOfFame')}</h2>
        <Card className="bg-transparent border border-gray-700/50">
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">{t('loadingRankings')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <h2 className="text-3xl text-gray-100">{t('hallOfFame')}</h2>
        <Card className="bg-transparent border border-gray-700/50">
          <CardContent>
            <div className="text-center py-8">
              <p className="text-red-400">{t('errorLoadingRankings')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : 'Failed to load data'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort rankings by profit ratio in descending order
  const rankings = (rankingData || [])
    .sort((a, b) => {
      const profitA = parseFloat(a.profitRatio) || 0
      const profitB = parseFloat(b.profitRatio) || 0
      return profitB - profitA  // Descending order (highest profit first)
    })

  return (
    <div className={cn("space-y-4 mt-6", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-3xl text-gray-100">{t('hallOfFame')}</h2>
      </div>
      <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
        {rankings.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-gray-400">{t('noRankingDataFound')}</p>
          </div>
        ) : (
          <>
            {/* Rankings Table */}
            <div className="rounded-2xl overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted/80 border-b border-gray-600">
                    <TableHead className="text-gray-300 text-base px-6 min-w-[80px] whitespace-nowrap">{t('rank')}</TableHead>
                    <TableHead className="text-gray-300 text-base px-6 pl-12 min-w-[120px] whitespace-nowrap">{t('user')}</TableHead>
                    <TableHead className="text-gray-300 text-base px-6 min-w-[100px] whitespace-nowrap">{t('profit')}</TableHead>
                    <TableHead className="text-gray-300 text-base px-6 min-w-[100px] whitespace-nowrap">{t('challenge')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Calculate pagination
                    const totalRankings = Math.min(rankings.length, maxPages * itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalRankings);
                    const paginatedRankings = rankings.slice(startIndex, endIndex);

                    return paginatedRankings.map((ranking, index) => {
                      const profitRatio = parseFloat(ranking.profitRatio)
                      const isPositive = profitRatio >= 0
                      const actualRank = startIndex + index + 1
                      
                      return (
                        <TableRow 
                          key={ranking.id} 
                          className="hover:bg-gray-800/30 border-0 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(ranking.challengeId, ranking.user)}
                        >
                          <TableCell className="font-medium text-gray-100 text-base px-6 py-6 min-w-[80px] whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>#{actualRank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-6 min-w-[120px] whitespace-nowrap">
                            <span className="text-sm text-gray-300 font-mono">
                              {formatAddress(ranking.user)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-6 min-w-[100px] whitespace-nowrap">
                            <div className={cn(
                              "flex items-center gap-1 font-medium text-base whitespace-nowrap",
                              isPositive ? "text-green-400" : "text-red-400"
                            )}>
                              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {formatProfitRatio(ranking.profitRatio)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 pl-8 py-6 min-w-[100px] whitespace-nowrap">
                            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap">
                              {getChallengeType(ranking.challengeId)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination - outside scrollable area, fixed at bottom */}
            {(() => {
              const totalRankings = Math.min(rankings.length, maxPages * itemsPerPage);
              const totalPages = Math.min(Math.ceil(totalRankings / itemsPerPage), maxPages);
              
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
        )}
      </CardContent>
    </Card>
    </div>
  )
} 