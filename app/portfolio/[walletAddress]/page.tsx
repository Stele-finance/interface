"use client"

import { notFound, useRouter } from "next/navigation"
import { useMemo, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Clock,
  CheckCircle,
  UserCheck
} from "lucide-react"
import { useInvestorPortfolio } from "@/app/hooks/useInvestorPortfolio"
import { useChallenge } from "@/app/hooks/useChallenge"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import Link from "next/link"
import { ethers } from "ethers"
import { USDC_DECIMALS } from "@/lib/constants"

interface PortfolioPageProps {
  params: Promise<{
    walletAddress: string
  }>
}

export default function PortfolioPage({ params }: PortfolioPageProps) {
  const { walletAddress } = use(params)
  const { t } = useLanguage()
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
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}%`
  }

  // Challenge Table Row Component
  const ChallengeRow = ({ investor }: { investor: any }) => {
    const { data: challengeData } = useChallenge(investor.challengeId, subgraphNetwork)
    const initialInvestment = safeFormatUSD(investor.seedMoneyUSD)
    const currentValue = safeFormatUSD(investor.currentUSD)
    
    // Use profit ratio from subgraph data (already calculated as percentage)
    const profitRatio = parseFloat(investor.profitRatio) || 0
    const isPositive = profitRatio >= 0

    // Check if challenge is active based on challenge data
    const isActive = useMemo(() => {
      if (!challengeData?.challenge?.endTime) return false
      const currentTime = Math.floor(Date.now() / 1000)
      const endTime = parseInt(challengeData.challenge.endTime)
      return currentTime < endTime
    }, [challengeData])

    const challengeType = challengeData?.challenge?.challengeType ?? parseInt(investor.challengeId) % 5
    const challengeTitle = getChallengeTitle(challengeType)

    const handleRowClick = () => {
      router.push(`/challenge/${investor.challengeId}/${walletAddress}`)
    }

    return (
      <tr 
        className="hover:bg-gray-800/30 transition-colors cursor-pointer" 
        onClick={handleRowClick}
      >
        <td className="py-6 px-4 whitespace-nowrap">
          <span className="font-medium text-gray-100">
            {challengeTitle}
          </span>
        </td>
        <td className="py-6 px-4">
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
        <td className="py-6 px-6">
          <div className="flex items-center gap-2">
            {investor.isRegistered && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="default"
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
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
            {isActive ? (
              <Badge 
                variant="default"
                className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                {t('active')}
              </Badge>
            ) : (
              <Badge 
                variant="secondary"
                className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('finished')}
              </Badge>
            )}
          </div>
        </td>
        <td className="py-6 pl-6 pr-4">
          <div className="flex items-center gap-3">
            <div>
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm">
                {investor.challengeId}
              </Badge>
            </div>
          </div>
        </td>
        <td className="py-6 px-4 text-gray-300 whitespace-nowrap">
          <div>
            {challengeData?.challenge?.startTime ? 
              formatDateTime(challengeData.challenge.startTime) : 
              '-'
            }
          </div>
        </td>
        <td className="py-6 px-4 text-gray-300 whitespace-nowrap">
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
    if (challenges.length === 0) return null

    return (
      <div>
        <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-6">{t('type')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-8">{t('profit')}</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 pl-10">{t('status')}</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 pl-6">{t('challenge')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-10">{t('startDate')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 pl-10">{t('endDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((investor) => (
                    <ChallengeRow key={investor.id} investor={investor} />
                  ))}
                </tbody>
              </table>
            </div>
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
              <div className="h-8 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-5 bg-gray-700 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Table Loading */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-6 bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            
            <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-900/80">
                        <th className="text-left py-3 px-4">
                          <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-4">
                          <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-6">
                          <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-6">
                          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-4">
                          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-4">
                          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-0">
                          <td className="py-6 px-4">
                            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex gap-2">
                              <div className="h-6 bg-gray-700 rounded-full w-16 animate-pulse"></div>
                              <div className="h-6 bg-gray-700 rounded-full w-14 animate-pulse"></div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                              <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
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
            <div className="flex items-center justify-between w-full gap-4">
              <h1 className="text-3xl text-gray-100">{t('portfolio')}</h1>
              <p className="text-xl text-gray-400 font-mono">
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