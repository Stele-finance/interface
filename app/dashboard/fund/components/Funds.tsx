'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFunds } from "../hooks/useFunds"
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Plus, Loader2, TrendingUp, DollarSign } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { ethers } from 'ethers'
import { NETWORK_CONTRACTS } from "@/lib/constants"
import SteleFundInfoABI from "@/app/abis/SteleFundInfo.json"

interface FundDisplayProps {
  id: string
  fundId: string
  manager: string
  investorCount: number
  tvl: number
  investment: number
  createdAt: Date
  updatedAt: Date
  tokens: string[]
  profitRatio: string
}


interface FundsProps {
  showCreateButton?: boolean;
  selectedNetwork?: 'ethereum' | 'arbitrum';
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void;
}

export function Funds({ showCreateButton = true, selectedNetwork = 'ethereum', setSelectedNetwork }: FundsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const { isConnected, getProvider } = useWallet()
  const queryClient = useQueryClient()
  const networkDropdownRef = useRef<HTMLDivElement>(null)

  // Use real fund data from GraphQL with selected network
  const { data: fundsData, isLoading, error } = useFunds(50, selectedNetwork)
  const funds = fundsData?.funds || []

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

  // Format currency
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    }
    return `$${num.toFixed(2)}`
  }

  // Format profit ratio
  const formatProfitRatio = (ratio: string) => {
    const num = parseFloat(ratio)
    if (isNaN(num)) return '+0.00%'
    const percentage = (num * 100).toFixed(2)
    return num >= 0 ? `+${percentage}%` : `${percentage}%`
  }

  // Calculate days since creation
  const calculateDaysSince = (createdAt: Date) => {
    const now = new Date()
    const diff = now.getTime() - createdAt.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Transform fund data for display
  const displayFunds: FundDisplayProps[] = funds.map(fund => ({
    id: fund.id,
    fundId: fund.fundId,
    manager: fund.manager,
    investorCount: parseInt(fund.investorCount),
    tvl: parseFloat(fund.amountUSD),
    investment: parseFloat(fund.share) / 1e6, // Convert from USDC decimals (10^6) to USD
    createdAt: new Date(parseInt(fund.createdAtTimestamp) * 1000),
    updatedAt: new Date(parseInt(fund.updatedAtTimestamp) * 1000),
    tokens: fund.tokensSymbols,
    profitRatio: fund.profitRatio
  }))

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
      await queryClient.invalidateQueries({ queryKey: ['funds', 50] })

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

  return (
    <>
      <div className="space-y-6">
        {/* Header with Network Dropdown */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-gray-100">{t('fund')}</h2>
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
                      setSelectedNetwork && setSelectedNetwork('ethereum')
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
                      setSelectedNetwork && setSelectedNetwork('arbitrum')
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

            {/* Create Fund Button */}
            {showCreateButton && isConnected && (
              <Button
                variant="default"
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                onClick={handleCreateFundClick}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-3 h-5 w-5" />
                    {t('create')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Funds Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-transparent"></div>
                Loading funds...
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              Error loading funds
            </div>
          ) : displayFunds.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-300 mb-1">No Funds Available</h3>
                <p className="text-sm text-gray-500">
                  There are currently no funds created. Funds will appear here once they are created.
                </p>
              </div>
            </div>
          ) : (
            displayFunds.map((fund) => {
              const profitRatio = parseFloat(fund.profitRatio)
              const isPositive = profitRatio >= 0
              const daysSince = calculateDaysSince(fund.createdAt)

              return (
                <Card
                  key={fund.id}
                  className="bg-muted/30 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all cursor-pointer rounded-2xl"
                  onClick={() => {
                    router.push(`/fund/${selectedNetwork}/${fund.fundId}`)
                  }}
                >
                  <CardContent className="p-8">
                    {/* Key Metrics Section - Large and Prominent */}
                    {/* Mobile: Profit Ratio full width, then Principal + Value in same row */}
                    {/* PC: All 3 in one row */}
                    <div className="mb-8 pb-8 border-b border-gray-700/50">
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-8">
                        {/* Profit Ratio - full width */}
                        <div className="flex flex-col justify-center space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <TrendingUp className="h-6 w-6" />
                            <span className="text-lg font-medium">{t('profitRatio')}</span>
                          </div>
                          <div className={`text-6xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatProfitRatio(fund.profitRatio)}
                          </div>
                        </div>

                        {/* Principal and Value - same row */}
                        <div className="grid grid-cols-2 gap-8">
                          <div className="flex flex-col justify-center space-y-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <DollarSign className="h-6 w-6" />
                              <span className="text-lg font-medium">{t('principal')}</span>
                            </div>
                            <div className="text-4xl font-bold text-blue-400">
                              {formatCurrency(fund.investment)}
                            </div>
                          </div>

                          <div className="flex flex-col justify-center space-y-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <DollarSign className="h-6 w-6" />
                              <span className="text-lg font-medium">{t('value')}</span>
                            </div>
                            <div className="text-4xl font-bold text-yellow-400">
                              {formatCurrency(fund.tvl)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop layout - all 3 in one row */}
                      <div className="hidden md:grid md:grid-cols-3 gap-8">
                        {/* Profit Ratio */}
                        <div className="flex flex-col justify-center space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <TrendingUp className="h-6 w-6" />
                            <span className="text-lg font-medium">{t('profitRatio')}</span>
                          </div>
                          <div className={`text-6xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatProfitRatio(fund.profitRatio)}
                          </div>
                        </div>

                        {/* Principal */}
                        <div className="flex flex-col justify-center space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign className="h-6 w-6" />
                            <span className="text-lg font-medium">{t('principal')}</span>
                          </div>
                          <div className="text-4xl font-bold text-blue-400">
                            {formatCurrency(fund.investment)}
                          </div>
                        </div>

                        {/* Value */}
                        <div className="flex flex-col justify-center space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign className="h-6 w-6" />
                            <span className="text-lg font-medium">{t('value')}</span>
                          </div>
                          <div className="text-4xl font-bold text-yellow-400">
                            {formatCurrency(fund.tvl)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fund Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {/* Fund ID - Hidden on mobile, shown on lg screens */}
                      <div className="hidden lg:flex items-center justify-between md:justify-start gap-2">
                        <div className="text-sm text-gray-400">{t('fund')} ID</div>
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600 text-sm">
                          #{fund.fundId}
                        </Badge>
                      </div>

                      {/* Manager Address */}
                      <div className="flex items-center justify-between md:justify-start gap-2">
                        <div className="text-sm text-gray-400">{t('manager')}</div>
                        <span className="text-sm text-gray-300 font-mono">
                          {fund.manager.slice(0, 6)}...{fund.manager.slice(-4)}
                        </span>
                      </div>

                      {/* Fund Duration */}
                      <div className="flex items-center justify-between md:justify-start gap-2">
                        <div className="text-sm text-gray-400">{t('duration')}</div>
                        <span className="text-sm text-gray-100 font-medium">
                          {daysSince} {t('days')}
                        </span>
                      </div>

                      {/* Investor Count */}
                      <div className="flex items-center justify-between md:justify-start gap-2">
                        <div className="text-sm text-gray-400">{t('investor')}</div>
                        <span className="text-sm text-gray-100 font-medium">
                          {fund.investorCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px] bg-muted/80 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-100">Create New Fund</DialogTitle>
            <DialogDescription className="text-base text-gray-300">
              Are you sure you want to create a new fund on {selectedNetwork === 'arbitrum' ? 'Arbitrum' : 'Ethereum'} network?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
