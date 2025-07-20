"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Vote as VoteIcon } from "lucide-react"
import { WalletTokenInfoProps } from "./types"

// Wallet Token Info Card component
export function WalletTokenInfo({
  isConnected,
  isLoadingWalletTokenInfo,
  walletTokenInfo,
  walletAddress,
  isDelegating,
  onDelegate,
  t
}: WalletTokenInfoProps) {
  if (!isConnected) {
    // Wallet Connection Prompt
    return (
      <Card className="mb-6 border-dashed bg-muted hover:bg-muted/80">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-400">{t('walletNotConnected')}</h3>
              <p className="text-xs text-gray-400">{t('connectWalletToViewBalance')}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-400">{t('pleaseConnectWallet')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-muted/80 border-0">
      {/* Delegate Button - Show prominently when user has tokens but is not delegated */}
      {!isLoadingWalletTokenInfo && walletTokenInfo && 
       Number(walletTokenInfo.formattedBalance) > 0 && 
       walletTokenInfo.delegatedTo === "0x0000000000000000000000000000000000000000" && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-orange-400">{t('delegateRequiredToVote')}</h3>
              <p className="text-xs text-gray-400 hidden md:block">{t('youNeedToDelegate')}</p>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={onDelegate}
              disabled={isDelegating}
              className="border-orange-600 text-orange-400 hover:bg-orange-900/20 bg-gray-800"
            >
              {isDelegating ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {t('delegating')}
                </div>
              ) : (
                <>
                  <VoteIcon className="mr-2 h-3 w-3" />
                  {t('delegateToSelf')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {isLoadingWalletTokenInfo ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-base text-gray-400">{t('loadingTokenInfo')}</span>
            </div>
          ) : walletTokenInfo ? (
            <>
              <div className="text-base">
                <span className="font-medium text-gray-300">{t('balance')}: </span>
                <span className="font-mono text-gray-100">{Number(walletTokenInfo.formattedBalance).toLocaleString()} STELE</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  <span>{t('delegatedTo')}: </span>
                  {walletTokenInfo.delegatedTo === "0x0000000000000000000000000000000000000000" ? (
                    <span className="text-orange-400">{t('notDelegated')}</span>
                  ) : walletTokenInfo.delegatedTo === walletAddress ? (
                    <span className="text-green-400">Self</span>
                  ) : (
                    <span className="font-mono">{walletTokenInfo.delegatedTo.slice(0, 6)}...{walletTokenInfo.delegatedTo.slice(-4)}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-base text-gray-400">{t('tokenInfoUnavailable')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 