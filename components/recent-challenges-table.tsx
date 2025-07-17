'use client'

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRecentChallenges, RecentChallenge } from "@/app/hooks/useRecentChallenges"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"

export function RecentChallengesTable() {
  const { t } = useLanguage()
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
        console.log('No match found for type:', typeStr)
        return t('unknown')
    }
  }

  const getChallengeStatus = (challenge: RecentChallenge) => {
    const startTime = new Date(Number(challenge.startTime) * 1000)
    const endTime = new Date(Number(challenge.endTime) * 1000)
    
    if (currentTime < startTime) {
      return "pending"
    }
    
    if (currentTime >= endTime || !challenge.isActive) {
      return "finished"
    }
    
    return "active"
  }

  const getStatusBadge = (status: "active" | "pending" | "finished") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 rounded-full px-2 py-1 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            {t('active')}
          </Badge>
        )
      case "pending":
        return <Badge variant="outline" className="border-gray-600 text-gray-300">{t('pending')}</Badge>
      case "finished":
        return (
          <Badge 
            variant="secondary"
            className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('finished')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{t('unknown')}</Badge>
    }
  }

  const formatDate = (timestamp: string): string => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString('en-US', {
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
                <TableHead className="text-gray-300 pl-6">{t('type')}</TableHead>
                <TableHead className="text-gray-300 pl-8">{t('prize')}</TableHead>
                <TableHead className="text-gray-300">{t('status')}</TableHead>
                <TableHead className="text-gray-300 pl-6">{t('challenge')}</TableHead>
                <TableHead className="text-gray-300 pl-10">{t('users')}</TableHead>
                <TableHead className="text-gray-300 pl-20">{t('startDate')}</TableHead>
                <TableHead className="text-gray-300 pl-16">{t('endDate')}</TableHead>
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
                      onClick={() => window.location.href = `/challenge/${challenge.challengeId}`}
                    >
                      <TableCell className="pl-6 py-6 whitespace-nowrap">
                        <span className="font-medium text-gray-100 text-base">
                          {getChallengeTypeName(challenge.challengeType)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-yellow-400 pl-8 py-6">
                        {formatUSDAmount(challenge.rewardAmountUSD)}
                      </TableCell>
                      <TableCell className="py-6">
                        {getStatusBadge(getChallengeStatus(challenge))}
                      </TableCell>
                      <TableCell className="pl-6 py-6">
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm">
                          {challenge.challengeId}
                        </Badge>
                      </TableCell>
                      <TableCell className="pl-10 py-6">
                        <div className="flex items-center gap-1 text-gray-300">
                          <Users className="h-4 w-4 text-gray-400" />
                          {challenge.investorCounter}
                        </div>
                      </TableCell>
                      <TableCell className="pl-10 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          {formatDate(challenge.startTime)}
                        </div>
                      </TableCell>
                      <TableCell className="pl-4 py-6 whitespace-nowrap">
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