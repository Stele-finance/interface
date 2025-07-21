import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { PortfolioMetrics, RealTimePortfolio } from "../types"
import Image from "next/image"

interface PortfolioSummaryProps {
  portfolioMetrics: PortfolioMetrics
  realTimePortfolio: RealTimePortfolio | null
  isLoadingUniswap: boolean
  challengeData: any
  network: string
  investorData: any
}

export function PortfolioSummary({ 
  portfolioMetrics, 
  realTimePortfolio, 
  isLoadingUniswap, 
  challengeData, 
  network, 
  investorData 
}: PortfolioSummaryProps) {
  const { t } = useLanguage()
  const { currentValue, formattedSeedMoney, gainLoss, gainLossPercentage, isPositive } = portfolioMetrics

  return (
    <Card className="bg-muted border-0 rounded-2xl">
      <CardContent className="p-8 space-y-8">
        {/* Row 1: Type and Status */}
        <div className="grid grid-cols-2 gap-6">
          {/* Type */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('type')}</span>
            <div className="text-3xl text-white">
              {(() => {
                const challengeType = challengeData?.challenge?.challengeType
                switch (challengeType) {
                  case 0:
                    return t('oneWeek');
                  case 1:
                    return t('oneMonth');
                  case 2:
                    return t('threeMonths');
                  case 3:
                    return t('sixMonths');
                  case 4:
                    return t('oneYear');
                  default:
                    return challengeType !== undefined ? `Type ${challengeType}` : `Type Unknown`;
                }
              })()}
            </div>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <span className="text-base text-gray-400">{t('status')}</span>
            <div className="flex items-center gap-2">
              {(() => {
                // Always show network icon regardless of status
                const networkIcon = network === 'ethereum' ? (
                  <Image 
                    src="/networks/small/ethereum.png" 
                    alt="Ethereum Mainnet"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : network === 'arbitrum' ? (
                  <Image 
                    src="/networks/small/arbitrum.png" 
                    alt="Arbitrum One"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : (
                  // Default to Ethereum icon if network is not recognized
                  <Image 
                    src="/networks/small/ethereum.png" 
                    alt="Ethereum Mainnet"
                    width={24}
                    height={24}
                    className="rounded-full"
                    style={{ width: '24px', height: '24px' }}
                  />
                );

                // If investor is closed, show as End
                if (investorData?.investor?.isRegistered === true) {
                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                        {networkIcon}
                      </div>
                      <span className="text-xl text-red-400">{t('end')}</span>
                    </>
                  )
                }
                // Otherwise show challenge active status
                const isActive = challengeData?.challenge?.isActive
                return (
                  <>
                    <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                      {networkIcon}
                    </div>
                    <span className={`text-xl ${isActive ? 'text-green-400' : 'text-orange-400'}`}>
                      {isActive ? t('active') : t('pending')}
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="space-y-2">
          <span className="text-base text-gray-400">{t('onChainValue')}</span>
          <div className="flex items-baseline gap-1">
            <div className="text-4xl text-white">
              ${currentValue.toFixed(2)}
            </div>
            <div className={`text-base ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              ({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
            </div>
          </div>
          {/* Real-time portfolio value */}
          {realTimePortfolio && (
            <div className="space-y-1">
              {(() => {
                const realTimeGainLoss = realTimePortfolio.totalValue - formattedSeedMoney
                const realTimeGainLossPercentage = formattedSeedMoney > 0 ? (realTimeGainLoss / formattedSeedMoney) * 100 : 0
                const isRealTimePositive = realTimeGainLoss >= 0
                
                return (
                  <div className={`text-base flex items-center gap-2 ${isRealTimePositive ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="w-3 h-3 bg-current rounded-full animate-pulse"></span>
                    {t('live')}: ${realTimePortfolio.totalValue.toFixed(2)} ({isRealTimePositive ? '+' : ''}{realTimeGainLossPercentage.toFixed(2)}%)
                  </div>
                )
              })()}
            </div>
          )}
          {isLoadingUniswap && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              {t('loadingLivePrices')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 