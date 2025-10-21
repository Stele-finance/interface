'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatDateWithLocale } from "@/lib/utils"
import {
  Wallet,
  ChevronDown,
  Coins,
  Users,
  DollarSign
} from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { getWalletLogo } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useManagerFunds } from "../hooks/useManagerFunds"
import Image from "next/image"
import Link from "next/link"

interface MyFundsTabProps {
  activeTab: 'my-funds' | 'all-funds'
  setActiveTab: (tab: 'my-funds' | 'all-funds') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function MyFundsTab({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }: MyFundsTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { address, isConnected, connectWallet } = useWallet()
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const isMobile = useIsMobile()

  // Use hooks for fund data
  const { data: fundsData, isLoading, error } = useManagerFunds(address || '', 100, selectedNetwork)

  const funds = fundsData?.funds || []

  // Helper function to format USD values
  const formatUSD = (value: string) => {
    const num = parseFloat(value)
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      await connectWallet()
      setWalletSelectOpen(false)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      alert(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  // Fund Table Row Component
  const FundRow = ({ fund }: { fund: any }) => {
    const handleRowClick = () => {
      router.push(`/fund/${selectedNetwork}/${fund.fundId}`)
    }

    return (
      <tr
        className="hover:bg-gray-800/30 transition-colors cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="py-6 pl-6 pr-4 min-w-[100px] whitespace-nowrap">
          <div className="ml-6">
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm whitespace-nowrap hover:bg-gray-800 hover:text-gray-300 hover:border-gray-600">
              #{fund.fundId}
            </Badge>
          </div>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <span className="font-medium text-green-400">
            {formatUSD(fund.amountUSD)}
          </span>
        </td>
        <td className="py-6 px-4 min-w-[100px] whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-gray-100">
              {fund.investorCount}
            </span>
          </div>
        </td>
        <td className="py-6 px-6 min-w-[120px] whitespace-nowrap">
          <span className="text-sm text-gray-400">
            {formatDateTime(fund.createdAtTimestamp)}
          </span>
        </td>
      </tr>
    )
  }

  // Fund Table Component
  const FundTable = ({ funds }: { funds: any[] }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const maxPages = 5

    if (funds.length === 0) return null

    const totalFunds = Math.min(funds.length, maxPages * itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalFunds)
    const paginatedFunds = funds.slice(startIndex, endIndex)
    const totalPages = Math.min(Math.ceil(totalFunds / itemsPerPage), maxPages)

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
                        <Coins className="h-4 w-4 text-blue-500" />
                        {t('fund')}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">TVL</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('investor')}</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('create')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFunds.map((fund) => (
                    <FundRow key={fund.id} fund={fund} />
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
          <h2 className="text-3xl text-gray-100 cursor-default">{t('myFunds')}</h2>
          <button
            onClick={() => setActiveTab('all-funds')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('allFunds')}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Network Selector Dropdown */}
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
                onClick={() => setSelectedNetwork('ethereum')}
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
                onClick={() => setSelectedNetwork('arbitrum')}
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
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex gap-4">
          <h2 className="text-3xl text-gray-100 cursor-default">{t('myFunds')}</h2>
          <button
            onClick={() => setActiveTab('all-funds')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('allFunds')}
          </button>
        </div>

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
                onClick={() => setSelectedNetwork('ethereum')}
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
                onClick={() => setSelectedNetwork('arbitrum')}
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
        </div>
      </div>

      {/* Show funds table when wallet is connected */}
      {isConnected && address ? (
        <>
          {isLoading ? (
            <Card className="bg-transparent border border-gray-700/50 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 bg-muted hover:bg-muted/80">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <th key={i} className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                            <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                          {[1, 2, 3, 4, 5, 6].map((j) => (
                            <td key={j} className="py-6 px-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {funds.length === 0 ? (
                <Card className="bg-muted border-gray-700/50">
                  <CardContent className="text-center py-12">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-100 mb-2">{t('noFundsFound')}</h3>
                    <p className="text-gray-400 mb-4">
                      {t('youHaventCreatedAnyFunds')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <FundTable funds={funds} />
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
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
