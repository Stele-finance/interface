'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFunds } from "../hooks/useFunds"
import { useQueryClient } from '@tanstack/react-query'
import { Users, ChevronDown, Plus, Loader2 } from "lucide-react"
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
  createdAt: Date
  updatedAt: Date
  tokens: string[]
}


interface FundsProps {
  showCreateButton?: boolean;
  activeTab?: 'funds' | 'tokens';
  setActiveTab?: (tab: 'funds' | 'tokens') => void;
  selectedNetwork?: 'ethereum' | 'arbitrum';
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void;
}

export function Funds({ showCreateButton = true, setActiveTab, selectedNetwork = 'ethereum', setSelectedNetwork }: FundsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { isConnected, getProvider } = useWallet()
  const queryClient = useQueryClient()
  
  // Use selectedNetwork for data fetching instead of wallet network
  const subgraphNetwork = selectedNetwork;

  // Use real fund data from GraphQL with selected network
  const { data: fundsData, isLoading, error } = useFunds(50, selectedNetwork)
  const funds = fundsData?.funds || []





  // Format fund data for display
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    }
    return `$${num.toFixed(2)}`
  }


  // Transform fund data for display
  const displayFunds: FundDisplayProps[] = funds.map(fund => ({
    id: fund.id,
    fundId: fund.fundId,
    manager: fund.manager,
    investorCount: parseInt(fund.investorCount),
    tvl: parseFloat(fund.currentUSD),
    createdAt: new Date(parseInt(fund.createdAtTimestamp) * 1000),
    updatedAt: new Date(parseInt(fund.updatedAtTimestamp) * 1000),
    tokens: fund.currentTokensSymbols
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

      console.log('Creating fund with contract:', contractAddress)
      
      // Call create function (not createFund) based on the ABI
      const tx = await fundInfoContract.create()
      console.log('Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('Fund created successfully!', receipt)
      
      // Refresh the funds data for the selected network
      await queryClient.invalidateQueries({ queryKey: ['funds', 50] })
      
      // Show success message
      console.log('Fund created successfully! Transaction hash: ' + receipt.transactionHash)
      
    } catch (error: any) {
      console.error('Error creating fund:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create fund'
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        // User rejected transaction - this is normal, don't show error
        console.log('User cancelled transaction')
        return // Exit without showing error
      } else if (error.message) {
        if (error.message.includes('user denied') || error.message.includes('rejected')) {
          console.log('User cancelled transaction')
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

      <div className="space-y-4 mt-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex gap-4">
            <h2 className="text-3xl text-gray-100 cursor-default">Fund</h2>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('tokens')}
                className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
              >
                {t('token')}
              </button>
            )}
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
            
            {/* Create Fund Button - same style as Challenge page */}
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
                    New
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Title and Tab */}
          <div className="flex gap-4">
            <h2 className="text-3xl text-gray-100 cursor-default">Fund</h2>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('tokens')}
                className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
              >
                {t('token')}
              </button>
            )}
          </div>
          
          {/* Network Dropdown and New Button */}
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
            
            {/* Create Fund Button Mobile - same style as Challenge page */}
            {showCreateButton && (
              <Button 
                variant="default" 
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
                onClick={handleCreateFund}
              >
                <Plus className="mr-3 h-5 w-5" />
                New
              </Button>
            )}
          </div>
        </div>
        <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="rounded-2xl overflow-hidden bg-muted hover:bg-muted/80 border-b border-gray-600">
                    <TableHead className="text-gray-300 pl-6 min-w-[120px] whitespace-nowrap">
                      Fund
                    </TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] whitespace-nowrap">TVL</TableHead>
                    <TableHead className="text-gray-300 min-w-[120px] whitespace-nowrap">
                      Investors
                    </TableHead>
                    <TableHead className="text-gray-300 min-w-[100px] pr-6 whitespace-nowrap">Manager</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-transparent"></div>
                          Loading funds...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-red-400 py-8">
                        Error loading funds
                      </TableCell>
                    </TableRow>
                  ) : displayFunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
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
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayFunds.map((fund) => (
                      <TableRow 
                        key={fund.id}
                        className="border-0 transition-colors hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => {
                          // Navigate to fund detail page
                          router.push(`/fund/${selectedNetwork}/${fund.fundId}`)
                        }}
                      >
                        <TableCell className="font-medium text-gray-100 pl-6 py-6 text-lg min-w-[120px] whitespace-nowrap">
                          <span className="whitespace-nowrap">Fund #{fund.fundId}</span>
                        </TableCell>
                        <TableCell className="font-medium text-green-400 py-6 text-lg min-w-[80px] whitespace-nowrap">
                          {formatCurrency(fund.tvl)}
                        </TableCell>
                        <TableCell className="py-6 min-w-[80px]">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-100">{fund.investorCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 py-6 min-w-[100px]">
                          <span className="text-sm text-gray-300 font-mono">
                            {fund.manager.slice(0, 6)}...{fund.manager.slice(-4)}
                          </span>
                        </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
