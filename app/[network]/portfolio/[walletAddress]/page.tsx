"use client"

import { notFound, useRouter } from "next/navigation"
import { useMemo, use, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { cn, formatDateWithLocale } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Clock,
  CheckCircle,
  UserCheck
} from "lucide-react"
import { useInvestorPortfolio } from "../hooks/useInvestorPortfolio"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import Link from "next/link"
import Image from "next/image"
import { ethers } from "ethers"
import { USDC_DECIMALS } from "@/lib/constants"

interface PortfolioPageProps {
  params: Promise<{
    network: string
    walletAddress: string
  }>
}

export default function PortfolioPage({ params }: PortfolioPageProps) {
  const { network: routeNetwork, walletAddress } = use(params)
  const { t, language } = useLanguage()
  const { network } = useWallet()
  const router = useRouter()
  
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  // Use hooks - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { data: portfolioData, isLoading, error } = useInvestorPortfolio(walletAddress, 100, subgraphNetwork)

  // Calculate derived state with useMemo
  const investors = portfolioData?.investors || []

  // Helper function to safely format USD values
  const safeFormatUSD = (value: string): number => {
    try {
      // Check if the value is already a decimal (contains '.')
      if (value.includes('.')) {
        return parseFloat(value)
      }
      // Otherwise, treat as raw amount and format with USDC_DECIMALS
      return parseFloat(ethers.formatUnits(value, USDC_DECIMALS))
    } catch (error) {
      console.warn('Error formatting USD value:', value, error)
      return parseFloat(value) || 0
    }
  }

  // Utility functions
  const getChallengeTitle = (challengeType: number) => {
    switch(challengeType) {
      case 0:
        return t('oneWeekChallenge')
      case 1:
        return t('oneMonthChallenge')
      case 2:
        return t('threeMonthsChallenge')
      case 3:
        return t('sixMonthsChallenge')
      case 4:
        return t('oneYearChallenge')
      default:
        return `${t('challengeType')} ${challengeType}`
    }
  }

  const formatDate = (timestamp: string) => {
    return formatDateWithLocale(new Date(Number(timestamp) * 1000), language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    return formatDateWithLocale(date, language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(4)}%`
  }

  // Challenge Table Row Component
  const ChallengeRow = ({ investor }: { investor: any }) => {
    const { data: challengeData } = useChallenge(investor.challengeId, subgraphNetwork)
    const initialInvestment = safeFormatUSD(investor.seedMoneyUSD)
    const currentValue = safeFormatUSD(investor.currentUSD)
    
    // Use profit ratio from subgraph data (already calculated as percentage)
    const profitRatio = parseFloat(investor.profitRatio) || 0
    const isPositive = profitRatio >= 0

    // Check challenge status based on challenge data
    const challengeStatus = useMemo(() => {
      if (!challengeData?.challenge?.endTime) return 'end'
      
      const challenge = challengeData.challenge
      const currentTime = Math.floor(Date.now() / 1000)
      const endTime = parseInt(challenge.endTime)
      const hasEnded = currentTime >= endTime
      
      if (challenge.isActive && !hasEnded) {
        return 'active'
      } else if (challenge.isActive && hasEnded) {
        return 'pending'
      } else {
        return 'end'
      }
    }, [challengeData])

    const challengeType = challengeData?.challenge?.challengeType ?? parseInt(investor.challengeId) % 5
    const challengeTitle = getChallengeTitle(challengeType)

    const handleRowClick = () => {
      router.push(`/${routeNetwork}/challenge/${investor.challengeId}/${walletAddress}`)
    }

    return (
      <tr 
        className="hover:bg-gray-800/30 transition-colors cursor-pointer" 
        onClick={handleRowClick}
      >
        <td className="py-6 pl-6 pr-4 min-w-[100px] whitespace-nowrap">
          <div className="ml-6">
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap hover:bg-gray-800 hover:text-gray-300 hover:border-gray-600">
              {investor.challengeId}
            </Badge>
          </div>
        </td>
        <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
          <div className="flex items-center gap-2">
            {investor.isRegistered && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="default"
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs whitespace-nowrap hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30"
                    >
                      <UserCheck className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('registered')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {(() => {
              switch (challengeStatus) {
                case 'active':
                  return (
                    <Badge 
                      variant="default"
                      className="bg-green-500/20 text-green-400 border-green-500/30 text-xs whitespace-nowrap hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {t('active')}
                    </Badge>
                  )
                case 'pending':
                  return (
                    <Badge 
                      variant="default"
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs whitespace-nowrap hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {t('pending')}
                    </Badge>
                  )
                case 'end':
                default:
                  return (
                    <Badge 
                      variant="secondary"
                      className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs whitespace-nowrap hover:bg-gray-500/20 hover:text-gray-400 hover:border-gray-500/30"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('end')}
                    </Badge>
                  )
              }
            })()}
          </div>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <div className="flex items-center gap-1">
            {isPositive ? 
              <TrendingUp className="h-3 w-3 text-emerald-400" /> : 
              <TrendingDown className="h-3 w-3 text-red-400" />
            }
            <span className={cn(
              "font-medium",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {formatPercentage(profitRatio)}
            </span>
          </div>
        </td>
        <td className="py-6 px-4 min-w-[120px] whitespace-nowrap">
          <span className="font-medium text-gray-100">
            {challengeTitle}
          </span>
        </td>
        <td className="py-6 px-4 text-gray-300 min-w-[140px] whitespace-nowrap">
          <div>
            {challengeData?.challenge?.startTime ? 
              formatDateTime(challengeData.challenge.startTime) : 
              '-'
            }
          </div>
        </td>
        <td className="py-6 px-4 text-gray-300 min-w-[140px] whitespace-nowrap">
          <div>
            {challengeData?.challenge?.endTime ? 
              formatDateTime(challengeData.challenge.endTime) : 
              '-'
            }
          </div>
        </td>
      </tr>
    )
  }

  // Challenge Section Component - simplified to show all challenges in one table
  const ChallengeTable = ({ challenges, title }: { challenges: any[], title: string }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const maxPages = 5

    if (challenges.length === 0) return null

    return (
      <div>
        <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
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
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('profit')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            {t('period')}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('startDate')}</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('endDate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Calculate pagination
                        const totalChallenges = Math.min(challenges.length, maxPages * itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = Math.min(startIndex + itemsPerPage, totalChallenges);
                        const paginatedChallenges = challenges.slice(startIndex, endIndex);

                        return paginatedChallenges.map((investor) => (
                          <ChallengeRow key={investor.id} investor={investor} />
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination - outside scrollable area, fixed at bottom */}
              {(() => {
                const totalChallenges = Math.min(challenges.length, maxPages * itemsPerPage);
                const totalPages = Math.min(Math.ceil(totalChallenges / itemsPerPage), maxPages);
                
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Loading */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              {/* Mobile: vertical layout, Desktop: horizontal layout - exactly like real header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4">
                <div className="h-8 bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Table Loading - matching exact structure */}
          <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-6 min-w-[120px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-8 animate-pulse"></div>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-8 min-w-[100px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-10 animate-pulse"></div>
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 pl-10 min-w-[120px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-12 animate-pulse"></div>
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 pl-6 min-w-[100px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-10 min-w-[140px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-10 min-w-[140px] whitespace-nowrap">
                        <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                        {/* Type column - "1 Week" */}
                        <td className="py-6 px-4 min-w-[120px] whitespace-nowrap">
                          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                        </td>
                        
                        {/* Profit column - icon + percentage */}
                        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 bg-gray-700 animate-pulse"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                          </div>
                        </td>
                        
                        {/* Status column - badge(s) */}
                        <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-gray-700 rounded-full w-16 animate-pulse"></div>
                          </div>
                        </td>
                        
                        {/* Challenge column - circular number badge */}
                        <td className="py-6 pl-6 pr-4 min-w-[100px] whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="h-7 w-7 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Start Date column */}
                        <td className="py-6 px-4 text-gray-300 min-w-[140px] whitespace-nowrap">
                          <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                        </td>
                        
                        {/* End Date column */}
                        <td className="py-6 px-4 text-gray-300 min-w-[140px] whitespace-nowrap">
                          <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    console.error('Portfolio error:', error)
    return notFound()
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            {/* Mobile: vertical layout, Desktop: horizontal layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4">
              <h1 className="text-3xl text-gray-100 whitespace-nowrap">{t('myPortfolio')}</h1>
              <p 
                className="text-lg sm:text-xl text-gray-400 font-mono whitespace-nowrap cursor-pointer hover:text-blue-400 transition-colors duration-200"
                onClick={() => {
                  const explorerUrl = subgraphNetwork === 'arbitrum' 
                    ? `https://arbiscan.io/address/${walletAddress}`
                    : `https://etherscan.io/address/${walletAddress}`
                  window.open(explorerUrl, '_blank')
                }}
                title={`View on ${subgraphNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
              >
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Challenge Sections */}
        {investors.length === 0 ? (
          <Card className="bg-muted border-gray-700/50">
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-100 mb-2">{t('noChallengesFoundPortfolio')}</h3>
              <p className="text-gray-400 mb-4">
                {t('thisWalletHasntParticipated')}
              </p>
              <Link href="/challenges">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  {t('browseChallenges')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ChallengeTable 
            challenges={investors}
            title=""
          />
        )}
      </div>
    </div>
  )
} 