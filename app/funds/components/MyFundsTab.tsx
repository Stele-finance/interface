'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Coins,
  Users,
  Plus,
  Loader2
} from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { getWalletLogo } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useManagerFunds } from "../hooks/useManagerFunds"
import Image from "next/image"
import { ethers } from 'ethers'
import { NETWORK_CONTRACTS } from "@/lib/constants"
import SteleFundInfoABI from "@/app/abis/SteleFundInfo.json"
import { useQueryClient } from '@tanstack/react-query'

interface MyFundsTabProps {
  activeTab: 'my-funds' | 'all-funds'
  setActiveTab: (tab: 'my-funds' | 'all-funds') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function MyFundsTab({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }: MyFundsTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { address, isConnected, connectWallet, getProvider } = useWallet()
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

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

  // Handle Create Fund button click - show confirmation modal
  const handleCreateFundClick = () => {
    setShowConfirmModal(true)
  }

  // Handle actual fund creation after confirmation
  const handleCreateFund = async () => {
    setShowConfirmModal(false)
    if (!isConnected) {
      console.error('Wallet not connected')
      return
    }

    setIsCreating(true)
    try {
      // Get provider and signer
      const provider = await getProvider()
      if (!provider) {
        throw new Error('No provider available')
      }

      // Always switch to the selected network before making the transaction
      const targetChainId = selectedNetwork === 'arbitrum' ? 42161 : 1

      // Try to switch to the selected network
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ])
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added to wallet, add it
          const networkConfig = selectedNetwork === 'arbitrum' ? {
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
          // User rejected the network switch
          const networkName = selectedNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'
          throw new Error(`Please switch to ${networkName} network to create a fund.`)
        } else {
          throw switchError
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider()
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch')
      }

      const signer = await updatedProvider.getSigner()

      // Get the correct contract address for the selected network
      const contractAddress = selectedNetwork === 'arbitrum'
        ? NETWORK_CONTRACTS.arbitrum_fund.STELE_FUND_INFO_ADDRESS
        : NETWORK_CONTRACTS.ethereum_fund.STELE_FUND_INFO_ADDRESS

      // Create contract instance
      const fundInfoContract = new ethers.Contract(
        contractAddress,
        SteleFundInfoABI.abi,
        signer
      )

      // Call create function (not createFund) based on the ABI
      const tx = await fundInfoContract.create()

      // Wait for transaction confirmation
      await tx.wait()

      // Refresh the funds data for the selected network
      await queryClient.invalidateQueries({ queryKey: ['managerFunds', address, 100] })

    } catch (error: any) {
      console.error('Error creating fund:', error)

      // Show user-friendly error message
      let errorMessage = 'Failed to create fund'

      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        // User rejected transaction - this is normal, don't show error
        return // Exit without showing error
      } else if (error.message) {
        if (error.message.includes('user denied') || error.message.includes('rejected')) {
          return // Exit without showing error
        }
        errorMessage = error.message
      } else if (error.code === -32603) {
        errorMessage = 'Internal error occurred'
      } else if (error.code === -32000) {
        errorMessage = 'Insufficient funds for gas'
      }

      // Log error to console instead of showing alert
      console.error(`Error: ${errorMessage}`)
    } finally {
      setIsCreating(false)
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
        {/* Show +New button only when connected and no funds */}
        {isConnected && funds.length === 0 && !isLoading && (
          <Button
            onClick={handleCreateFundClick}
            disabled={isCreating}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('myFunds')}</h2>
            <button
              onClick={() => setActiveTab('all-funds')}
              className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              {t('allFunds')}
            </button>
          </div>

          {/* Show +New button only when connected and no funds */}
          {isConnected && funds.length === 0 && !isLoading && (
            <Button
              onClick={handleCreateFundClick}
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
              size="sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  <span className="text-xs">Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" />
                  <span className="text-xs">New</span>
                </>
              )}
            </Button>
          )}
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

      {/* Confirmation Modal for Creating Fund */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px] bg-muted/80 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-100">Create New Fund</DialogTitle>
            <DialogDescription className="text-base text-gray-300">
              Are you sure you want to create a new fund on {selectedNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'} network?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-gray-600 hover:bg-gray-700"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFund}
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Fund
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
