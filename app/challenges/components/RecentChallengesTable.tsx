'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Trophy, Users, Clock, CheckCircle } from "lucide-react"
import { useRecentChallenges, RecentChallenge } from "../hooks/useRecentChallenges"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface RecentChallengesTableProps {
  selectedNetwork?: 'ethereum' | 'arbitrum'
}

export function RecentChallengesTable({ selectedNetwork = 'ethereum' }: RecentChallengesTableProps) {
  const { t } = useLanguage()
  const router = useRouter()

  // Use selected network for subgraph queries
  const subgraphNetwork = selectedNetwork
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Items per page

  // Fetch data with pagination - queries only current page data
  const { data, isLoading, error } = useRecentChallenges(subgraphNetwork, currentPage, itemsPerPage)

  // Calculate max pages based on actual total count
  const maxPages = data?.challengesTotal ? Math.ceil(data.challengesTotal.length / itemsPerPage) : 0

  // Update time every second for accurate status calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getChallengeTypeName = (type: string): string => {
    // Convert to string to handle both number and string inputs
    const typeStr = String(type)
    
    switch (typeStr) {
      case "0": return t('oneWeek')
      case "1": return t('oneMonth')
      case "2": return t('threeMonths')
      case "3": return t('sixMonths')
      case "4": return t('oneYear')
      default: 
        return t('unknown')
    }
  }

  const getChallengeStatus = (challenge: RecentChallenge) => {
    const startTime = new Date(Number(challenge.startTime) * 1000)
    const endTime = new Date(Number(challenge.endTime) * 1000)
    const hasEnded = currentTime >= endTime
    
    if (challenge.isActive && !hasEnded) {
      return "active"
    } else if (challenge.isActive && hasEnded) {
      return "pending"
    } else {
      return "end"
    }
  }

  const getStatusBadge = (status: "active" | "pending" | "end") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 rounded-full px-2 py-1 flex items-center gap-1 w-fit whitespace-nowrap pointer-events-none hover:bg-green-600/20 focus:bg-green-600/20 transition-none">
            <Clock className="h-3 w-3" />
            {t('active')}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-1 flex items-center gap-1 w-fit text-xs whitespace-nowrap pointer-events-none hover:bg-orange-500/20 focus:bg-orange-500/20 transition-none">
            <Clock className="h-3 w-3" />
            {t('pending')}
          </Badge>
        )
      case "end":
        return (
          <Badge 
            variant="secondary"
            className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs whitespace-nowrap pointer-events-none hover:bg-gray-500/20 focus:bg-gray-500/20 transition-none"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('end')}
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="whitespace-nowrap pointer-events-none hover:bg-secondary focus:bg-secondary transition-none">{t('unknown')}</Badge>
    }
  }


  const formatUSDAmount = (amount: string): string => {
    const num = Number(amount)
    return `$${num.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.challenges) {
    return (
      <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="text-center py-8 px-6">
            <p className="text-gray-400">{t('errorLoadingChallenges')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {data.challenges.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-8 w-8 text-gray-500 mx-auto" />
              <p className="text-gray-400 mt-2">{t('noChallengesFound')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              {/* Show network icon only when connected to Arbitrum */}
                              {subgraphNetwork === 'arbitrum' && (
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                  <Image 
                                    src="/networks/small/arbitrum.png" 
                                    alt="Arbitrum"
                                    width={8}
                                    height={8}
                                    className="rounded-full"
                                    style={{ width: 'auto', height: 'auto' }}
                                  />
                                </div>
                              )}
                            </div>
                            {t('challenge')}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('status')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⌛</span>
                            {t('progress')}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('prize')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('users')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.challenges.map((challenge) => (
                        <tr
                          key={challenge.id}
                          className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                          onClick={() => router.push(`/challenge/${subgraphNetwork}/${challenge.challengeId}`)}
                        >
                          <td className="py-6 pl-6 pr-4">
                            <div className="ml-6">
                              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap">
                                {challenge.challengeId}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            {getStatusBadge(getChallengeStatus(challenge))}
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Progress
                                        value={Math.min(100, Math.max(0, ((new Date().getTime() / 1000 - Number(challenge.startTime)) / (Number(challenge.endTime) - Number(challenge.startTime))) * 100))}
                                        className="w-20 h-3"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{Math.min(100, Math.max(0, Math.round(((new Date().getTime() / 1000 - Number(challenge.startTime)) / (Number(challenge.endTime) - Number(challenge.startTime))) * 100)))}% {t('progress')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
                                {Math.min(100, Math.max(0, Math.round(((new Date().getTime() / 1000 - Number(challenge.startTime)) / (Number(challenge.endTime) - Number(challenge.startTime))) * 100)))}%
                              </span>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="font-medium text-yellow-400 whitespace-nowrap">
                              {formatUSDAmount(challenge.rewardAmountUSD)}
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-1 text-gray-300 whitespace-nowrap">
                              <Users className="h-4 w-4 text-gray-400" />
                              {challenge.investorCounter}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination - outside scrollable area, fixed at bottom */}
              {maxPages > 1 && (
                <div className="flex justify-center py-4 px-6 border-t border-gray-600">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                        />
                      </PaginationItem>

                      {Array.from({ length: maxPages }, (_, i) => i + 1).map((page) => (
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
                          onClick={() => setCurrentPage(Math.min(maxPages, currentPage + 1))}
                          className={currentPage === maxPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-700"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
    </Card>
  )
} 