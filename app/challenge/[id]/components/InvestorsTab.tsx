import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useChallengeInvestors, ChallengeInvestorData } from "../../hooks/useChallengeInvestors"
import { useRouter } from "next/navigation"
import { formatDateOnly } from "@/lib/utils"

interface InvestorsTabProps {
  challengeId: string
  subgraphNetwork: string
}

export function InvestorsTab({ challengeId, subgraphNetwork }: InvestorsTabProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  
  const { data: investorData = [], isLoading: isLoadingInvestors, error: investorsError } = useChallengeInvestors(
    challengeId, 
    5, 
    subgraphNetwork as 'ethereum' | 'arbitrum'
  )

  // Helper function to format date
  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000)
    return formatDateOnly(date, language)
  }

  // Helper function to format USD value
  const formatUSD = (value: string) => {
    const num = parseFloat(value)
    return `$${num.toFixed(2)}`
  }

  // Helper function to format user address
  const formatUserAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Helper function to handle wallet click
  const handleWalletClick = (walletAddress: string) => {
    router.push(`/challenge/${challengeId}/${walletAddress}`)
  }

  return (
    <Card className="bg-transparent border border-gray-600 rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {isLoadingInvestors ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-gray-400">{t('loading')}...</span>
          </div>
        ) : investorsError ? (
          <div className="text-center py-8 text-red-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Error loading investors</p>
            <p className="text-sm text-gray-400 mt-2">Please try again later</p>
          </div>
        ) : investorData.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600 bg-muted hover:bg-muted/80">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('wallet')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('value')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 whitespace-nowrap">{t('register')}</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-400 whitespace-nowrap">{t('updated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {investorData.map((investor: ChallengeInvestorData, index: number) => (
                    <tr 
                      key={investor.id} 
                      className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => handleWalletClick(investor.investor)}
                    >
                      {/* Wallet column */}
                      <td className="py-6 pl-6 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Ranking badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-medium min-w-[20px]">
                              {index + 1}
                            </span>
                          </div>
                          {/* Wallet address */}
                          <div className="text-gray-300 text-sm hover:text-blue-400 transition-colors">
                            {formatUserAddress(investor.investor)}
                          </div>
                        </div>
                      </td>

                      {/* Current USD column */}
                      <td className="py-6 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-100">
                          {formatUSD(investor.currentUSD)}
                        </div>
                      </td>

                      {/* Registered column */}
                      <td className="py-6 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {investor.isRegistered ? (
                            <Badge 
                              variant="default"
                              className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                            >
                              {t('yes')}
                            </Badge>
                          ) : (
                            <Badge 
                              variant="secondary"
                              className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"
                            >
                              {t('no')}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Updated column */}
                      <td className="py-6 px-6 whitespace-nowrap">
                        <div className="text-right text-sm text-gray-400">
                          {formatDate(investor.updatedAtTimestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noInvestorsFound')}</p>
            <p className="text-sm mt-2">{t('noInvestorsFoundDescription')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 