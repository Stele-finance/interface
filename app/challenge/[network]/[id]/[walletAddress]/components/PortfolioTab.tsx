import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { getTokenLogo } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { useTokenPrices } from "@/lib/token-price-context"
import { formatTokenAmount, getTokenExplorerUrl } from "../utils"
import Image from "next/image"

interface PortfolioTabProps {
  userTokens: any[]
  isLoadingUniswap: boolean
  subgraphNetwork: string
  onTokenClick: (tokenAddress: string) => void
}

export function PortfolioTab({ 
  userTokens, 
  isLoadingUniswap, 
  subgraphNetwork, 
  onTokenClick 
}: PortfolioTabProps) {
  const { t } = useLanguage()
  const { getTokenPriceBySymbol } = useTokenPrices()

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {userTokens.length > 0 ? (
            <table className="w-full min-w-[300px]">
              <thead>
                <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                  <th className="text-left py-3 pl-10 md:pl-14 sm:pl-6 pr-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('token')}</th>
                  <th className="text-right py-3 pr-10 md:pr-10 sm:pr-6 px-4 sm:px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {userTokens.map((token, index) => {
                  // Get price from global token price context
                  const priceData = getTokenPriceBySymbol(token.symbol)
                  const tokenPrice = priceData?.priceUSD || 0
                  const isLoadingPrice = isLoadingUniswap
                  const hasValidPrice = tokenPrice > 0
                  const tokenAmount = parseFloat(token.amount) || 0
                  const tokenValue = hasValidPrice ? tokenPrice * tokenAmount : 0
                  
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => onTokenClick(token.address)}
                    >
                      <td className="py-6 pl-4 sm:pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                                                     {(() => {
                             const logoPath = getTokenLogo(token.address, subgraphNetwork as 'ethereum' | 'arbitrum')
                             
                             if (logoPath) {
                              return (
                                <Image
                                  src={logoPath}
                                  alt={token.symbol}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                  onError={(e: any) => {
                                    console.error('Failed to load token logo:', logoPath)
                                    const target = e.target as HTMLImageElement
                                    target.outerHTML = `
                                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        ${token.symbol.slice(0, 2)}
                                      </div>
                                    `
                                  }}
                                />
                              )
                            } else {
                              return (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {token.symbol.slice(0, 2)}
                                </div>
                              )
                            }
                          })()}
                            {/* Show Arbitrum network icon only when connected to Arbitrum */}
                            {subgraphNetwork === 'arbitrum' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                                <Image 
                                  src="/networks/small/arbitrum.png" 
                                  alt="Arbitrum One"
                                  width={14}
                                  height={14}
                                  className="rounded-full"
                                  style={{ width: 'auto', height: 'auto' }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-100">{token.symbol}</p>
                            <p className="text-sm text-gray-400">{token.address.slice(0, 8)}...{token.address.slice(-6)}</p>
                            {/* Show real-time price */}
                            {isLoadingPrice ? (
                              <p className="text-xs text-gray-500">{t('loadingPrice')}</p>
                            ) : tokenPrice > 0 ? (
                              <p className="text-xs text-green-400">${tokenPrice.toFixed(4)} {t('perToken')}</p>
                            ) : (
                              <p className="text-xs text-gray-500">{t('priceUnavailable')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 sm:px-6">
                        <div className="text-right">
                          <p className="font-medium text-gray-100">{formatTokenAmount(token.amount)}</p>
                          {/* Show USD value */}
                          {isLoadingPrice ? (
                            <p className="text-sm text-gray-500">{t('loading')}</p>
                          ) : tokenValue > 0 ? (
                            <p className="text-sm text-green-400">${tokenValue.toFixed(2)}</p>
                          ) : (
                            <p className="text-sm text-gray-500">$0.00</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noTokensFound')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 