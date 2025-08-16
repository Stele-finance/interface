'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Coins, ChevronDown } from "lucide-react"
import { useInvestableTokens } from "@/app/hooks/useInvestableTokens"
import { useLanguage } from "@/lib/language-context"
import { getTokenLogo } from "@/lib/utils"
import Image from "next/image"
import { useState, useMemo } from "react"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"

interface InvestableTokensProps {
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
  setActiveTab?: (tab: 'challenges' | 'tokens') => void
  selectedNetwork?: 'ethereum' | 'arbitrum'
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void
}

export function InvestableTokens({ network, setActiveTab, selectedNetwork = 'ethereum', setSelectedNetwork }: InvestableTokensProps) {
  const { t } = useLanguage()
  // Use selectedNetwork for data fetching
  const subgraphNetwork = selectedNetwork
  const { data: tokensData, isLoading, error } = useInvestableTokens(subgraphNetwork)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Calculate pagination data
  const tokens = tokensData?.investableTokens || []
  const totalPages = Math.ceil(tokens.length / itemsPerPage)
  
  const paginatedTokens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return tokens.slice(startIndex, endIndex)
  }, [tokens, currentPage, itemsPerPage])

  // Format token address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get explorer URL based on network
  const getTokenExplorerUrl = (tokenAddress: string) => {
    if (subgraphNetwork === 'arbitrum') {
      return `https://arbiscan.io/token/${tokenAddress}`
    }
    return `https://etherscan.io/token/${tokenAddress}`
  }

  // Handle row click to open appropriate explorer
  const handleRowClick = (tokenAddress: string) => {
    window.open(getTokenExplorerUrl(tokenAddress), '_blank')
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  return (
    <div className="space-y-4 mt-8">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex gap-4">
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('challenges')}
              className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t('challenge')}
            </button>
          )}
          <h2 className="text-3xl text-gray-100 cursor-default">
            {setActiveTab ? t('token') : t('investableTokens')}
          </h2>
          {!setActiveTab && (
            <Badge variant="secondary" className="bg-gray-700/20 text-gray-300 border-gray-500/30 text-base px-4 py-2 rounded-full border">
              <Coins className="h-4 w-4 mr-2" />
              {tokens.length} {t('token')}
            </Badge>
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
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex gap-4">
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('challenges')}
              className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t('challenge')}
            </button>
          )}
          <h2 className="text-3xl text-gray-100 cursor-default">
            {setActiveTab ? t('token') : t('investableTokens')}
          </h2>
          {!setActiveTab && (
            <Badge variant="secondary" className="bg-gray-700/20 text-gray-300 border-gray-500/30 text-base px-4 py-2 rounded-full border">
              <Coins className="h-4 w-4 mr-2" />
              {tokens.length} {t('token')}
            </Badge>
          )}
        </div>
        
        {/* Network Dropdown */}
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
        </div>
      </div>
      <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">{t('loadingTokens')}</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 px-6">
            <p className="text-red-400">{t('errorLoadingTokens')}</p>
            <p className="text-sm text-gray-500 mt-1">
              {error instanceof Error ? error.message : 'Failed to load data'}
            </p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-gray-400">{t('noInvestableTokensFound')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="rounded-2xl overflow-hidden bg-muted hover:bg-muted/80 border-b border-gray-600">
                    <TableHead className="text-gray-300 pl-6 text-base">{t('symbol')}</TableHead>
                    <TableHead className="text-gray-300 text-base">{t('tokenAddress')}</TableHead>
                    <TableHead className="text-gray-300 pr-6 text-base">{t('updated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTokens.map((token) => (
                    <TableRow 
                      key={token.id} 
                      className="border-0 hover:bg-gray-800/30 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(token.tokenAddress)}
                    >
                      <TableCell className="font-medium text-gray-100 pl-6 py-6 text-base">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                          {getTokenLogo(token.tokenAddress, subgraphNetwork) ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                              <Image
                                src={getTokenLogo(token.tokenAddress, subgraphNetwork)!}
                                alt={token.symbol}
                                width={32}
                                height={32}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}
                            {/* Show Arbitrum network icon only when connected to Arbitrum */}
                            {network === 'arbitrum' && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                <Image 
                                  src="/networks/small/arbitrum.png" 
                                  alt="Arbitrum"
                                  width={12}
                                  height={12}
                                  className="rounded-full"
                                  style={{ width: 'auto', height: 'auto' }}
                                />
                              </div>
                            )}
                          </div>
                          <span>{token.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-sm text-gray-300 font-mono">
                          {formatAddress(token.tokenAddress)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400 pr-6 py-6 text-base whitespace-nowrap">
                        {formatDate(token.updatedTimestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center py-4 px-6 border-t border-gray-600">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-700'}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum as number)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer hover:bg-gray-700"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-700'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </div>
  )
} 