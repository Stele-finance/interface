'use client'

import { ChallengeTypeModal } from "./ChallengeTypeModal"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  getSteleContractAddress,
} from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useActiveChallenges } from "../hooks/useActiveChallenges"
import { Users, CheckCircle, Clock, Trophy, ChevronDown, Calendar, Timer } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useQueryClient } from "@tanstack/react-query"

interface ActiveChallengesProps {
  selectedNetwork?: 'ethereum' | 'arbitrum';
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void;
}

function calculateTimeLeft(endTime: string, currentTime: Date = new Date()): { days: number; hours: number; minutes: number; seconds: number; ended: boolean } {
  const end = new Date(Number(endTime) * 1000)
  const now = currentTime

  if (now >= end) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }
  }

  const diff = end.getTime() - now.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, ended: false }
}

function calculateProgress(startTime: string, endTime: string, isCompleted: boolean, currentTime: Date = new Date()): number {
  if (isCompleted) return 100

  const start = new Date(Number(startTime) * 1000)
  const end = new Date(Number(endTime) * 1000)
  const now = currentTime

  if (now < start) return 0
  if (now >= end) return 100

  const totalDuration = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
}

export function ActiveChallenges({ selectedNetwork = 'ethereum', setSelectedNetwork }: ActiveChallengesProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const { getProvider, isConnected } = useWallet()
  const queryClient = useQueryClient()

  const subgraphNetwork = selectedNetwork
  const { data } = useActiveChallenges(subgraphNetwork)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [isClient])

  const handleCreateChallenge = async (challengeType: number) => {
    setIsCreating(true)

    try {
      const provider = await getProvider()
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.")
      }

      const targetChainId = subgraphNetwork === 'arbitrum' ? 42161 : 1

      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ])
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const networkConfig = subgraphNetwork === 'arbitrum' ? {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/']
          } : {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
          }

          await provider.send('wallet_addEthereumChain', [networkConfig])
        } else if (switchError.code === 4001) {
          const networkName = subgraphNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'
          throw new Error(`Please switch to ${networkName} network to create a challenge.`)
        } else {
          throw switchError
        }
      }

      const updatedProvider = await getProvider()
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch')
      }

      const signer = await updatedProvider.getSigner()

      const steleContract = new ethers.Contract(
        getSteleContractAddress(subgraphNetwork),
        SteleABI.abi,
        signer
      )

      const tx = await steleContract.createChallenge(challengeType)
      await tx.wait()

      setIsRefreshing(true)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activeChallenges', subgraphNetwork] })
        setIsRefreshing(false)
      }, 3000)

    } catch (error: any) {
      console.error("Error creating challenge:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // Get one week challenge data
  const weekChallenge = data?.activeChallenges ? {
    participants: Number(data.activeChallenges.one_week_investorCounter) || 0,
    prize: Number(data.activeChallenges.one_week_rewardAmountUSD) || 0,
    startTime: data.activeChallenges.one_week_startTime,
    endTime: data.activeChallenges.one_week_endTime,
    isCompleted: data.activeChallenges.one_week_isCompleted,
    challengeId: data.activeChallenges.one_week_id || "1",
    status: (data.activeChallenges.one_week_isCompleted ? "end" :
            isClient && currentTime > new Date(Number(data.activeChallenges.one_week_endTime) * 1000) ? "pending" : "active") as "active" | "pending" | "end"
  } : {
    participants: 0,
    prize: 0,
    startTime: "0",
    endTime: "0",
    isCompleted: false,
    challengeId: "",
    status: "active" as "active" | "pending" | "end"
  }

  const timeLeft = isClient ? calculateTimeLeft(weekChallenge.endTime, currentTime) : { days: 0, hours: 0, minutes: 0, seconds: 0, ended: false }
  const progress = isClient ? calculateProgress(weekChallenge.startTime, weekChallenge.endTime, weekChallenge.isCompleted, currentTime) : 0

  const getStatusBadge = (status: "active" | "pending" | "end") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-600/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-green-600/20 focus:bg-green-600/20 transition-none">
            <Clock className="h-4 w-4" />
            {t('active')}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-orange-500/20 focus:bg-orange-500/20 transition-none">
            <Clock className="h-4 w-4" />
            {t('pending')}
          </Badge>
        )
      case "end":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 w-fit text-sm whitespace-nowrap pointer-events-none hover:bg-gray-500/20 focus:bg-gray-500/20 transition-none">
            <CheckCircle className="h-3 w-3" />
            {t('end')}
          </Badge>
        )
    }
  }

  const formatDate = (timestamp: string) => {
    if (timestamp === "0") return "-"
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {isRefreshing && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            <div className="text-white text-lg font-medium">{t('challengeCreatedSuccessfully')}</div>
            <div className="text-gray-300 text-sm">{t('refreshingData')}</div>
          </div>
        </div>,
        document.body
      )}

      <div className="space-y-6">
        {/* Header with Network Dropdown */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-gray-100">{t('tradingCompetition')}</h2>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="p-3 bg-transparent border-gray-600 hover:bg-gray-700">
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
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted/80 border-gray-600">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('ethereum')}
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setSelectedNetwork && setSelectedNetwork('arbitrum')}
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isConnected && weekChallenge.status === "end" && (
              <ChallengeTypeModal
                onCreateChallenge={handleCreateChallenge}
                isCreating={isCreating}
                activeChallenges={[{ challengeType: 0, status: weekChallenge.status }]}
              />
            )}
          </div>
        </div>

        {/* Hero Section - Prize Pool and Timer */}
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-0 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left - Total Prize Pool */}
              <div className="flex flex-col justify-center space-y-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="h-6 w-6" />
                  <span className="text-lg font-medium">{t('totalPrize')}</span>
                </div>
                <div className="text-6xl font-bold text-yellow-400">
                  ${weekChallenge.prize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-5 w-5" />
                  <span>{weekChallenge.participants} {t('participants')}</span>
                </div>
              </div>

              {/* Right - Countdown Timer */}
              <div className="flex flex-col justify-center space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <Timer className="h-6 w-6" />
                  <span className="text-lg font-medium">{t('timeLeft')}</span>
                </div>
                {timeLeft.ended ? (
                  <div className="text-4xl font-bold text-gray-400">
                    {t('ended')}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-3xl font-bold text-orange-400">{String(timeLeft.days).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400 mt-1">{t('days')}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-3xl font-bold text-orange-400">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400 mt-1">{t('hours')}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-3xl font-bold text-orange-400">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400 mt-1">{t('minutes')}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-3xl font-bold text-orange-400">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400 mt-1">{t('seconds')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenge Info Card */}
        <Card
          className="bg-transparent border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          onClick={() => {
            if (weekChallenge.challengeId && weekChallenge.challengeId !== "") {
              router.push(`/challenge/${selectedNetwork}/${weekChallenge.challengeId}`)
            }
          }}
        >
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Challenge Period */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('period')}</span>
                </div>
                <div className="text-gray-100 font-medium text-base">
                  {formatDate(weekChallenge.startTime)} - {formatDate(weekChallenge.endTime)}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400">{t('status')}</div>
                <div>{getStatusBadge(weekChallenge.status)}</div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400">{t('progress')}</div>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1 h-3" />
                  <span className="text-sm text-gray-400 font-medium whitespace-nowrap">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Users */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400">{t('users')}</div>
                <div className="flex items-center gap-2 text-gray-100 text-base font-medium">
                  <Users className="h-4 w-4" />
                  <span>{weekChallenge.participants}</span>
                </div>
              </div>

              {/* Challenge ID */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{t('challenge')} ID</span>
                </div>
                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm">
                  {weekChallenge.challengeId || "-"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
