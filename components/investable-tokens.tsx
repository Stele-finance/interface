'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useInvestableTokens } from "@/app/hooks/useInvestableTokens"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

interface InvestableTokensProps {
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
}

export function InvestableTokens({ network }: InvestableTokensProps) {
  const { t } = useLanguage()
  // Filter network for subgraph usage (exclude solana)
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  const { data: tokensData, isLoading, error } = useInvestableTokens(subgraphNetwork)

  // Format token address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get token logo path based on symbol
  const getTokenLogo = (symbol: string) => {
    const symbolLower = symbol.toLowerCase()
    // Check if we have a logo for this token
    const availableLogos = ['usdc', 'eth', 'weth']
    if (availableLogos.includes(symbolLower)) {
      return `/tokens/${symbolLower}.png`
    }
    // Return a default placeholder or null if no logo exists
    return null
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl text-gray-100">{t('investableTokens')}</h2>
        <Card className="bg-transparent border border-gray-700/50">
          <CardContent className="p-0">
            <div className="flex items-center justify-center py-8 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">{t('loadingTokens')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl text-gray-100">{t('investableTokens')}</h2>
        <Card className="bg-transparent border border-gray-700/50">
          <CardContent className="p-0">
            <div className="text-center py-8 px-6">
              <p className="text-red-400">{t('errorLoadingTokens')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : 'Failed to load data'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tokens = tokensData?.investableTokens || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl text-gray-100">{t('investableTokens')}</h2>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-base px-3 py-1.5">
          {tokens.length} {t('tokens')}
        </Badge>
      </div>
      <Card className="bg-transparent border border-gray-700/50">
        <CardContent className="p-0">
        {tokens.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-gray-400">{t('noInvestableTokensFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-700 bg-gray-900/80 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300 pl-6 text-base">{t('symbol')}</TableHead>
                  <TableHead className="text-gray-300 text-base">{t('tokenAddress')}</TableHead>
                  <TableHead className="text-gray-300 pr-6 text-base">{t('lastUpdated')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow 
                    key={token.id} 
                    className="border-0 hover:bg-gray-800/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(token.tokenAddress)}
                  >
                    <TableCell className="font-medium text-gray-100 pl-6 py-6 text-base">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                        {getTokenLogo(token.symbol) ? (
                          <Image
                            src={getTokenLogo(token.symbol)!}
                            alt={token.symbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {token.symbol.slice(0, 2)}
                          </div>
                        )}
                          {/* Show Arbitrum network icon only when connected to Arbitrum */}
                          {network === 'arbitrum' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
                              <Image 
                                src="/networks/arbitrum.png" 
                                alt="Arbitrum"
                                width={12}
                                height={12}
                                className="rounded-full"
                                style={{ width: '12px', height: '12px' }}
                              />
                            </div>
                          )}
                        </div>
                        <span>{token.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <code className="text-sm bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        {formatAddress(token.tokenAddress)}
                      </code>
                    </TableCell>
                    <TableCell className="text-gray-400 pr-6 py-6 text-base">
                      {formatDate(token.updatedTimestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
} 