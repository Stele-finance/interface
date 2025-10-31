'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn, formatDateWithLocale } from "@/lib/utils"
import { 
  Wallet, 
  ChevronDown,
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Clock,
  CheckCircle
} from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { getWalletLogo } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useInvestorPortfolio } from "../hooks/useInvestorPortfolio"
import { useChallenge } from "@/app/hooks/useChallenge"
import { ethers } from "ethers"
import { USDC_DECIMALS } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"

interface MyPortfolioTabProps {
  activeTab: 'portfolio' | 'challenges'
  setActiveTab: (tab: 'portfolio' | 'challenges') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function MyPortfolioTab({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }: MyPortfolioTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { address, isConnected, connectWallet, network } = useWallet()
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Handle click outside for network dropdown
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false)
      }
    }

    if (showNetworkDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [showNetworkDropdown])

  // Use hooks for portfolio data
  const { data: portfolioData, isLoading, error } = useInvestorPortfolio(address || '', 100, selectedNetwork)
  
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

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      await connectWallet() // No parameters needed - WalletConnect only
      setWalletSelectOpen(false)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      alert(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  // Challenge Table Row Component
  const ChallengeRow = ({ investor }: { investor: any }) => {
    const { data: challengeData } = useChallenge(investor.challengeId, selectedNetwork)
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
      router.push(`/challenge/${selectedNetwork}/${investor.challengeId}/${address}`)
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
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Progress 
                      value={challengeData?.challenge ? Math.min(100, Math.max(0, ((new Date().getTime() / 1000 - Number(challengeData.challenge.startTime)) / (Number(challengeData.challenge.endTime) - Number(challengeData.challenge.startTime))) * 100)) : 0} 
                      className="w-20 h-3"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{challengeData?.challenge ? Math.min(100, Math.max(0, Math.round(((new Date().getTime() / 1000 - Number(challengeData.challenge.startTime)) / (Number(challengeData.challenge.endTime) - Number(challengeData.challenge.startTime))) * 100))) : 0}% {t('progress')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
              {challengeData?.challenge ? Math.min(100, Math.max(0, Math.round(((new Date().getTime() / 1000 - Number(challengeData.challenge.startTime)) / (Number(challengeData.challenge.endTime) - Number(challengeData.challenge.startTime))) * 100))) : 0}%
            </span>
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
      </tr>
    )
  }

  // Challenge Table Component
  const ChallengeTable = ({ challenges }: { challenges: any[] }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const maxPages = 5

    if (challenges.length === 0) return null

    const totalChallenges = Math.min(challenges.length, maxPages * itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalChallenges)
    const paginatedChallenges = challenges.slice(startIndex, endIndex)
    const totalPages = Math.min(Math.ceil(totalChallenges / itemsPerPage), maxPages)

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
                        <div className="relative">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          {/* Show network icon only when connected to Arbitrum */}
                          {selectedNetwork === 'arbitrum' && (
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
                    <th className="text-left py-3 px-10 text-sm font-medium text-gray-400 whitespace-nowrap">{t('status')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⌛</span>
                        {t('progress')}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('profit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChallenges.map((investor) => (
                    <ChallengeRow key={investor.id} investor={investor} />
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
          <h2 className="text-3xl text-gray-100 cursor-default">{t('myChallenge')}</h2>
          <button
            onClick={() => setActiveTab('challenges')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('totalChallenges')}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Network Selector Dropdown */}
          <div className="relative" ref={networkDropdownRef}>
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="p-3 bg-transparent border border-gray-600 hover:bg-gray-700 rounded-md"
            >
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
            </button>
            {showNetworkDropdown && (
              <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <button
                  onClick={() => {
                    setSelectedNetwork('ethereum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </button>
                <button
                  onClick={() => {
                    setSelectedNetwork('arbitrum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('myChallenge')}</h2>
          <button
            onClick={() => setActiveTab('challenges')}
            className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            {t('totalChallenges')}
          </button>
        </div>
        
        {/* Network Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={networkDropdownRef}>
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="p-3 bg-transparent border border-gray-600 hover:bg-gray-700 rounded-md"
            >
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
            </button>
            {showNetworkDropdown && (
              <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-muted/80 border border-gray-600 rounded-md shadow-lg z-[60]">
                <button
                  onClick={() => {
                    setSelectedNetwork('ethereum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/ethereum.png"
                    alt="Ethereum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Ethereum
                </button>
                <button
                  onClick={() => {
                    setSelectedNetwork('arbitrum')
                    setShowNetworkDropdown(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                >
                  <Image
                    src="/networks/small/arbitrum.png"
                    alt="Arbitrum"
                    width={16}
                    height={16}
                    className="rounded-full mr-2"
                  />
                  Arbitrum
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show portfolio table when wallet is connected, otherwise show connect wallet card */}
      {isConnected && address ? (
        <>
          {isLoading ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                          <td className="py-6 px-4 min-w-[120px] whitespace-nowrap">
                            <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                          </td>
                          <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 bg-gray-700 animate-pulse"></div>
                              <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </td>
                          <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-3 bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                            </div>
                          </td>
                          <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 bg-gray-700 animate-pulse"></div>
                              <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </td>
                          <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
                            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {investors.length === 0 ? (
                <Card className="bg-muted border-gray-700/50">
                  <CardContent className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-100 mb-2">{t('noChallengesFoundPortfolio')}</h3>
                    <p className="text-gray-400">
                      {t('thisWalletHasntParticipated')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ChallengeTable challenges={investors} />
              )}
            </>
          )}
        </>
      ) : (
        <Card className="bg-muted border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-center text-gray-100">{t('connectWallet')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Wallet className="h-16 w-16 text-gray-400" />
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-gray-400">
                {t('connectToAccess')}
              </p>
              
              <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('connectWallet')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-muted/80 border-gray-600">
                  <DialogHeader>
                    <DialogTitle>{t('connectWallet')}</DialogTitle>
                    <DialogDescription>
                      {t('selectWalletToConnect')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-16 flex items-center justify-start gap-4 p-4 bg-muted/40 border-gray-600 hover:bg-muted/60"
                      onClick={() => handleConnectWallet()}
                      disabled={isConnecting}
                    >
                      <Image 
                        src={getWalletLogo('walletconnect')} 
                        alt="WalletConnect"
                        width={24}
                        height={24}
                        style={{ width: 'auto', height: '24px' }}
                      />
                      <div className="text-left">
                        <div className="font-semibold">WalletConnect</div>
                        <div className="text-sm text-muted-foreground">
                          {isMobile ? 'Connect Mobile Wallet' : t('browserExtension')}
                        </div>
                      </div>
                    </Button>
                  </div>
                  <div className="border-t border-gray-600 pt-4 pb-2">
                    <p className="text-xs text-center text-muted-foreground leading-relaxed">
                      {t('byConnectingWalletPrefix')}{' '}
                      <a
                        href="/terms-of-service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                      >
                        {t('termsOfService')}
                      </a>
                      {' '}{t('byConnectingWalletMiddle')}{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                      >
                        {t('privacyPolicy')}
                      </a>
                      {t('byConnectingWalletSuffix')}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}