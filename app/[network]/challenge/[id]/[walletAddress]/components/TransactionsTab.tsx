import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Loader2, Receipt, Activity, ArrowRight } from "lucide-react"
import { getTokenLogo } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { formatRelativeTime, getTransactionTypeColor, getTransactionTypeText, formatUserAddress, getExplorerUrl, getSwapDetails } from "../utils"
import Image from "next/image"

interface TransactionsTabProps {
  challengeId: string
  investorTransactions: any[]
  isLoadingTransactions: boolean
  transactionsError: any
  subgraphNetwork: string
  walletAddress: string
}

export function TransactionsTab({ 
  challengeId,
  investorTransactions, 
  isLoadingTransactions, 
  transactionsError, 
  subgraphNetwork, 
  walletAddress 
}: TransactionsTabProps) {
  const { t } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxPages = 5

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-gray-400">{t('loadingTransactions')}</span>
          </div>
        ) : transactionsError ? (
          <div className="text-center py-8 text-red-400">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('errorLoadingTransactions')}</p>
            <p className="text-sm text-gray-400 mt-2">Please try again later</p>
          </div>
        ) : investorTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('time')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('type')}</th>
                      <th className="text-left py-3 px-10 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                      <th className="text-right py-3 px-20 sm:px-40 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                   {(() => {
                    // Calculate pagination
                    const totalTransactions = Math.min(investorTransactions.length, maxPages * itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);
                    const paginatedTransactions = investorTransactions.slice(startIndex, endIndex);

                    return paginatedTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => {
                      const chainId = subgraphNetwork === 'arbitrum' ? '0xa4b1' : '0x1';
                      window.open(getExplorerUrl(chainId, transaction.transactionHash), '_blank');
                    }}
                  >
                    <td className="py-6 pl-6 pr-4">
                      <div className="text-sm text-gray-400">
                        {formatRelativeTime(transaction.timestamp, t as any)}
                      </div>
                    </td>
                                         <td className="py-6 px-4">
                       <div className={`font-medium whitespace-nowrap ${getTransactionTypeColor(transaction.type)}`}>
                         {getTransactionTypeText(transaction.type, t as any)}
                       </div>
                     </td>
                    <td className="py-6 px-4">
                      <div className="text-gray-300 text-sm">
                        {transaction.type === 'reward' ? formatUserAddress(transaction.user) : formatUserAddress(walletAddress)}
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="text-right">
                      {transaction.type === 'swap' ? (
                        (() => {
                          const swapDetails = getSwapDetails(transaction)
                          if (swapDetails) {
                            const fromLogo = getTokenLogo(swapDetails.fromToken, subgraphNetwork as 'ethereum' | 'arbitrum')
                            const toLogo = getTokenLogo(swapDetails.toToken, subgraphNetwork as 'ethereum' | 'arbitrum')
                            return (
                              <div className="flex items-center gap-2 justify-end min-w-0 flex-wrap md:flex-nowrap">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative flex-shrink-0">
                                  {fromLogo ? (
                                    <Image 
                                      src={fromLogo} 
                                      alt={(swapDetails as any).fromTokenSymbol || swapDetails.fromToken || 'Token'}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                      {((swapDetails as any).fromTokenSymbol || swapDetails.fromToken)?.slice(0, 1) || '?'}
                                    </div>
                                  )}
                                    {/* Show Arbitrum network icon only when connected to Arbitrum */}
                                    {subgraphNetwork === 'arbitrum' && (
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                        <Image 
                                          src="/networks/small/arbitrum.png" 
                                          alt="Arbitrum One"
                                          width={10}
                                          height={10}
                                          className="rounded-full"
                                          style={{ width: 'auto', height: 'auto' }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.fromAmount} {(swapDetails as any).fromTokenSymbol || swapDetails.fromToken}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative flex-shrink-0">
                                  {toLogo ? (
                                    <Image 
                                      src={toLogo} 
                                      alt={(swapDetails as any).toTokenSymbol || swapDetails.toToken || 'Token'}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                      {((swapDetails as any).toTokenSymbol || swapDetails.toToken)?.slice(0, 1) || '?'}
                                    </div>
                                  )}
                                    {/* Show Arbitrum network icon only when connected to Arbitrum */}
                                    {subgraphNetwork === 'arbitrum' && (
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                        <Image 
                                          src="/networks/small/arbitrum.png" 
                                          alt="Arbitrum One"
                                          width={10}
                                          height={10}
                                          className="rounded-full"
                                          style={{ width: 'auto', height: 'auto' }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm md:text-base font-medium text-gray-100 truncate">{swapDetails.toAmount && swapDetails.toAmount !== '0' ? `${swapDetails.toAmount} ` : ''}{(swapDetails as any).toTokenSymbol || swapDetails.toToken}</span>
                                </div>
                              </div>
                            )
                          }
                          return <p className="text-sm md:text-base font-medium text-gray-100 truncate">{transaction.amount || '-'}</p>
                        })()
                      ) : transaction.type === 'airdrop' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="relative flex-shrink-0">
                            <Image 
                              src="/tokens/small/stl.png" 
                              alt="STL Token"
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {subgraphNetwork === 'arbitrum' && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-transparent rounded-full">
                                <Image 
                                  src="/networks/small/arbitrum.png" 
                                  alt="Arbitrum"
                                  width={12}
                                  height={12}
                                  className="w-full h-full object-contain"
                                  style={{ width: 'auto', height: 'auto' }}
                                />
                              </div>
                            )}
                          </div>
                          <span className="text-sm md:text-base font-medium text-gray-100 truncate">{transaction.amount || '-'}</span>
                        </div>
                      ) : transaction.type === 'join' || transaction.type === 'register' ? (
                        <p className="text-sm md:text-base font-medium text-gray-100 truncate">{formatUserAddress(transaction.user)}</p>
                      ) : (
                        <p className="font-medium text-gray-100 truncate">{transaction.amount || '-'}</p>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination - outside scrollable area, fixed at bottom */}
          {(() => {
            const totalTransactions = Math.min(investorTransactions.length, maxPages * itemsPerPage);
            const totalPages = Math.min(Math.ceil(totalTransactions / itemsPerPage), maxPages);
            
            return totalPages > 1 && (
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
            );
          })()}
        </>
      ) : (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found for this investor</p>
            <p className="text-sm mt-2">Transaction history will appear here once you start trading</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 