'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Clock, CheckCircle } from "lucide-react"
import { useRecentChallenges, RecentChallenge } from "../hooks/useRecentChallenges"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { formatDateWithLocale } from "@/lib/utils"

export function RecentChallengesTable() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { network } = useWallet()
  
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  const { data, isLoading, error } = useRecentChallenges(subgraphNetwork)
  const [currentTime, setCurrentTime] = useState(new Date())

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

  const formatDate = (timestamp: string): string => {
    const date = new Date(Number(timestamp) * 1000)
    return formatDateWithLocale(date, language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatUSDAmount = (amount: string): string => {
    const num = Number(amount)
    return `$${num.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl text-gray-100">{t('totalChallenges')}</h2>
        <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data?.challenges) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl text-gray-100">{t('totalChallenges')}</h2>
        <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="text-center py-8 px-6">
              <p className="text-gray-400">{t('errorLoadingChallenges')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl text-gray-100">
        {t('totalChallenges')}
      </h2>
      <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                <TableHead className="text-gray-300 pl-6 min-w-[120px] whitespace-nowrap">{t('type')}</TableHead>
                <TableHead className="text-gray-300 pl-8 min-w-[80px] whitespace-nowrap">{t('prize')}</TableHead>
                <TableHead className="text-gray-300 min-w-[100px] whitespace-nowrap">{t('status')}</TableHead>
                <TableHead className="text-gray-300 pl-6 min-w-[80px] whitespace-nowrap">{t('challenge')}</TableHead>
                <TableHead className="text-gray-300 pl-10 min-w-[80px] whitespace-nowrap">{t('users')}</TableHead>
                <TableHead className="text-gray-300 pl-20 min-w-[140px] whitespace-nowrap">{t('startDate')}</TableHead>
                <TableHead className="text-gray-300 pl-16 min-w-[140px] whitespace-nowrap">{t('endDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.challenges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="h-8 w-8 text-gray-500" />
                      <p className="text-gray-400">{t('noChallengesFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.challenges.map((challenge) => {
                  return (
                    <TableRow 
                      key={challenge.id} 
                      className="border-0 hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/challenge/${challenge.challengeId}`)}
                    >
                      <TableCell className="pl-6 py-6 min-w-[120px] whitespace-nowrap">
                        <span className="font-medium text-gray-100 text-base whitespace-nowrap">
                          {getChallengeTypeName(challenge.challengeType)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-yellow-400 pl-8 py-6 min-w-[80px] whitespace-nowrap">
                        {formatUSDAmount(challenge.rewardAmountUSD)}
                      </TableCell>
                      <TableCell className="py-6 min-w-[100px]">
                        {getStatusBadge(getChallengeStatus(challenge))}
                      </TableCell>
                      <TableCell className="pl-6 py-6 min-w-[80px]">
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap">
                          {challenge.challengeId}
                        </Badge>
                      </TableCell>
                      <TableCell className="pl-10 py-6 min-w-[80px]">
                        <div className="flex items-center gap-1 text-gray-300 whitespace-nowrap">
                          <Users className="h-4 w-4 text-gray-400" />
                          {challenge.investorCounter}
                        </div>
                      </TableCell>
                      <TableCell className="pl-10 py-6 min-w-[140px] whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          {formatDate(challenge.startTime)}
                        </div>
                      </TableCell>
                      <TableCell className="pl-4 py-6 min-w-[140px] whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          {formatDate(challenge.endTime)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </div>
  )
} 