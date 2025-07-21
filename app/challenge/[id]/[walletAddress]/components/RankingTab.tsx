import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Loader2, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { formatDateWithLocale } from "@/lib/utils"

interface RankingTabProps {
  rankingData: any
  isLoadingRanking: boolean
  rankingError: any
  challengeId: string
  walletAddress: string
}

export function RankingTab({ 
  rankingData, 
  isLoadingRanking, 
  rankingError, 
  challengeId, 
  walletAddress 
}: RankingTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [rankingCurrentPage, setRankingCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxPages = 5

  // Format address
  const formatAddress = (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return '';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Format score (USDC value)
  const formatScore = (score: string) => {
    try {
      const scoreValue = parseFloat(score);
      return `$${scoreValue.toFixed(2)}`;
    } catch {
      return '$0.00';
    }
  };
  
  // Format profit ratio
  const formatProfitRatio = (profitRatio: string) => {
    try {
      const ratioValue = parseFloat(profitRatio);
      return `${ratioValue >= 0 ? '+' : ''}${ratioValue.toFixed(2)}%`;
    } catch {
      return '0.00%';
    }
  };
  
  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      case 4:
        return '🏅';
      case 5:
        return '🎖️';
      default:
        return rank.toString();
    }
  };

  // Handle user click
  const handleUserClick = (userAddress: string) => {
    // Check if address is empty or zero address
    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return;
    }
    router.push(`/challenge/${challengeId}/${userAddress}`);
  };

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {isLoadingRanking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-gray-400">Loading rankings...</span>
            </div>
          ) : rankingError ? (
            <div className="text-center py-8 text-red-400">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Error loading rankings</p>
              <p className="text-sm text-gray-400 mt-2">Please try again later</p>
            </div>
          ) : rankingData && rankingData.topUsers.length > 0 ? (
            (() => {
              // Calculate pagination for ranking
              const totalRankingUsers = Math.min(rankingData.topUsers.length, maxPages * itemsPerPage);
              const rankingStartIndex = (rankingCurrentPage - 1) * itemsPerPage;
              const rankingEndIndex = Math.min(rankingStartIndex + itemsPerPage, totalRankingUsers);
              const paginatedUsers = rankingData.topUsers.slice(rankingStartIndex, rankingEndIndex);
              const rankingTotalPages = Math.min(Math.ceil(totalRankingUsers / itemsPerPage), maxPages);

              return (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[80px]">{t('rank')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[120px]">{t('user')}</th>
                        <th className="text-right py-3 px-10 sm:px-10 text-sm font-medium text-gray-400 whitespace-nowrap min-w-[120px]">{t('profitRatio')}</th>
                      </tr>
                    </thead>
                    <tbody>
                                             {paginatedUsers.map((user: any, paginatedIndex: number) => {
                        const actualIndex = rankingStartIndex + paginatedIndex;
                        const rank = actualIndex + 1;
                        const score = rankingData.scores[actualIndex];
                        const profitRatio = rankingData.profitRatios[actualIndex];
                        
                        const formattedAddress = formatAddress(user);
                        const isEmptySlot = !formattedAddress;
                        const isCurrentUser = walletAddress && user.toLowerCase() === walletAddress.toLowerCase();

                        return (
                          <tr 
                            key={`${user}-${rank}`} 
                            className={`hover:bg-gray-800/30 transition-colors ${isCurrentUser ? 'ring-2 ring-blue-500/50' : ''} ${
                              isEmptySlot ? 'cursor-default' : 'cursor-pointer'
                            }`}
                            onClick={() => !isEmptySlot && handleUserClick(user)}
                          >
                            <td className="py-6 pl-6 pr-4">
                              <div className="flex items-center justify-center w-10 h-10">
                                {rank <= 5 ? (
                                  <span className="text-3xl">{getRankIcon(rank)}</span>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">{rank}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-6 px-4">
                              <div className="font-medium flex items-center gap-2">
                                {isEmptySlot ? (
                                  <span className="text-gray-500 italic">Empty Slot</span>
                                ) : (
                                  <>
                                    <span className="text-gray-300">{formattedAddress}</span>
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                                        You
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-6 px-6">
                              <div className="text-right">
                                <div className="font-bold text-lg text-white">{formatScore(score)}</div>
                                <div className={`text-sm ${parseFloat(profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatProfitRatio(profitRatio)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination for Ranking */}
                  {rankingTotalPages > 1 && (
                    <div className="flex justify-center mt-2">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setRankingCurrentPage(Math.max(1, rankingCurrentPage - 1))}
                              className={rankingCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: rankingTotalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setRankingCurrentPage(page)}
                                isActive={rankingCurrentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setRankingCurrentPage(Math.min(rankingTotalPages, rankingCurrentPage + 1))}
                              className={rankingCurrentPage === rankingTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )
            })()
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No ranking data found</p>
              <p className="text-sm mt-1">Rankings will appear once users register for the challenge</p>
            </div>
          )}
          
          {rankingData && (
            <div className="border-t border-gray-700">
              <div className="mt-2 mb-2 text-xs text-gray-500 text-center">
                Last updated: {formatDateWithLocale(new Date(parseInt(rankingData.updatedAtTimestamp) * 1000), language)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 