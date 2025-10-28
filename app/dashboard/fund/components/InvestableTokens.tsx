'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Coins, ChevronDown } from "lucide-react"
import { useFundInvestableTokenPrices } from "../../../fund/hooks/useFundInvestableTokenPrices"
import { useLanguage } from "@/lib/language-context"
import { getTokenLogo } from "@/lib/utils"
import Image from "next/image"
import { useState, useMemo, useRef, useEffect } from "react"
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
  setActiveTab?: (tab: 'funds' | 'tokens') => void
  selectedNetwork?: 'ethereum' | 'arbitrum'
  setSelectedNetwork?: (network: 'ethereum' | 'arbitrum') => void
}

export function InvestableTokens({ setActiveTab, selectedNetwork = 'ethereum', setSelectedNetwork }: InvestableTokensProps) {
  const { t } = useLanguage()
  const subgraphNetwork = selectedNetwork
  const { data: tokensWithPrices, isLoading, error } = useFundInvestableTokenPrices(selectedNetwork)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const networkDropdownRef = useRef<HTMLDivElement>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // Calculate pagination data
  const tokens = useMemo(() => {
    return tokensWithPrices || []
  }, [tokensWithPrices])
  
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
      month: 'numeric',
      day: 'numeric'
    })
  }

  // Format price for display
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
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
              onClick={() => setActiveTab('funds')}
              className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t('fund')}
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
          {setSelectedNetwork && (
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
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('funds')}
              className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              {t('fund')}
            </button>
          )}
          <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">
            {setActiveTab ? t('token') : t('investableTokens')}
          </h2>
          {!setActiveTab && (
            <Badge variant="secondary" className="bg-gray-700/20 text-gray-300 border-gray-500/30 text-base px-4 py-2 rounded-full border whitespace-nowrap">
              <Coins className="h-4 w-4 mr-2" />
              {tokens.length} {t('token')}
            </Badge>
          )}
        </div>
        
        {/* Network Selector Dropdown (Mobile) */}
        <div className="flex items-center gap-3">
          {setSelectedNetwork && (
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
          )}
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
          <div className="text-center py-12 px-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-300 mb-1">No Tokens Available</h3>
                <p className="text-sm text-gray-500">
                  No investable tokens found. Tokens will appear here once they are marked as investable.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="rounded-2xl overflow-hidden bg-muted hover:bg-muted/80 border-b border-gray-600">
                    <TableHead className="text-gray-300 pl-6 text-base">{t('symbol')}</TableHead>
                    <TableHead className="text-gray-300 text-base">{t('tokenAddress')}</TableHead>
                    <TableHead className="text-gray-300 text-base">Price</TableHead>
                    <TableHead className="text-gray-300 pr-6 text-base">{t('updated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTokens.map((token) => (
                    <TableRow 
                      key={token.id} 
                      className="border-0 hover:bg-gray-800/30 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(token.address)}
                    >
                      <TableCell className="font-medium text-gray-100 pl-6 py-6 text-base">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                          {getTokenLogo(token.address, subgraphNetwork) ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                              <Image
                                src={getTokenLogo(token.address, subgraphNetwork)!}
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
                            {/* Show Arbitrum network icon only when on Arbitrum */}
                            {selectedNetwork === 'arbitrum' && (
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
                          {formatAddress(token.address)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-green-400 py-6 text-lg">
                        {formatPrice(token.price)}
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