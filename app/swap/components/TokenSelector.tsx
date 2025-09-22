"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, Check } from "lucide-react"
import { cn, getTokenLogo } from "@/lib/utils"
import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TokenSelectorProps } from "./types"
import { useLanguage } from "@/lib/language-context"

export function TokenSelector({
  selectedToken,
  availableTokens,
  onTokenSelect,
  isOpen,
  onOpenChange,
  label,
  userTokens = [],
  subgraphNetwork,
  getTokenAddress
}: TokenSelectorProps) {
  const { t } = useLanguage()
  
  return (
    <div className="relative token-dropdown">
      <Button
        variant="ghost"
        onClick={() => availableTokens.length > 0 ? onOpenChange(!isOpen) : undefined}
        disabled={availableTokens.length === 0}
        className="bg-transparent hover:bg-muted/60 border border-gray-600 text-white rounded-full px-4 py-2 text-sm font-medium h-auto gap-2 transition-all duration-200 min-w-[120px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          {availableTokens.length === 0 ? (
            <span className="text-gray-400">{label === "From" ? "No tokens" : "Select token"}</span>
          ) : selectedToken ? (
            <>
              <Image
                src={getTokenLogo(getTokenAddress(selectedToken), subgraphNetwork) || `/tokens/small/${selectedToken.toLowerCase()}.png`}
                alt={selectedToken}
                width={20}
                height={20}
                className="rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const avatar = target.nextElementSibling as HTMLElement
                  if (avatar) avatar.style.display = 'flex'
                }}
              />
              <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                  {selectedToken.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span>{selectedToken}</span>
            </>
          ) : (
            <span>{t('select')}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-muted/80 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {availableTokens.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              {label === "From" ? "No tokens available in fund" : "No investable tokens available"}
            </div>
          ) : (
            <>
              {!selectedToken && (
                <div
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 cursor-pointer text-gray-400 text-sm"
                  onClick={() => {
                    onTokenSelect("")
                    onOpenChange(false)
                  }}
                >
                  <span>{t('select')}</span>
                </div>
              )}
              {availableTokens.map((token) => (
            <div
              key={token}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 cursor-pointer text-white text-sm"
              onClick={() => {
                onTokenSelect(token)
                onOpenChange(false)
              }}
            >
              <Image
                src={getTokenLogo(getTokenAddress(token), subgraphNetwork) || `/tokens/small/${token.toLowerCase()}.png`}
                alt={token}
                width={20}
                height={20}
                className="rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const avatar = target.nextElementSibling as HTMLElement
                  if (avatar) avatar.style.display = 'flex'
                }}
              />
              <Avatar className="w-5 h-5" style={{ display: 'none' }}>
                <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                  {token.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span>{token}</span>
              {selectedToken === token && <Check className="h-4 w-4 ml-auto" />}
            </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
} 