"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TokenSelector } from "./TokenSelector"
import { SwapInputProps } from "./types"
import { useLanguage } from "@/lib/language-context"

export function SwapInput({
  amount,
  token,
  onAmountChange,
  onTokenSelect,
  availableTokens,
  userTokens,
  isFrom,
  subgraphNetwork,
  getTokenAddress,
  getTokenDecimals,
  getFormattedTokenBalance,
  handlePercentageClick,
  getSwapAmountUSD,
  isBelowMinimumSwapAmount,
  isAmountExceedsBalance,
  priceData,
  toTokenPrice
}: SwapInputProps) {
  const { t } = useLanguage()
  const [isHovering, setIsHovering] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Limit decimal places based on token decimals
      if (value.includes('.') && token) {
        const parts = value.split('.');
        const maxDecimals = getTokenDecimals(token);
        if (parts[1] && parts[1].length > maxDecimals) {
          return; // Don't update if more decimal places than token supports
        }
      }
      onAmountChange(value)
    }
  }

  const formatOutputAmount = (outputAmount: string): string => {
    if (!outputAmount || outputAmount === "0") return "0";
    const num = parseFloat(outputAmount);
    if (num % 1 === 0) return num.toString();
    return num.toFixed(Math.min(5, getTokenDecimals(token))).replace(/\.?0+$/, '');
  }

  return (
    <div className="space-y-2">
      <div 
        className="p-4 bg-transparent border border-gray-600 rounded-2xl relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="text-sm text-gray-400 mb-3">
          {isFrom ? t('sell') : t('buy')}
        </div>
        <div className="flex items-center justify-between min-h-[60px]">
          <div className="flex-1 min-w-0 pr-4">
            {isFrom ? (
              <>
                <Input
                  placeholder="0"
                  value={amount}
                  onChange={handleFromAmountChange}
                  className={`bg-transparent border-0 p-1 h-12 focus-visible:ring-0 w-full overflow-hidden text-ellipsis rounded-none outline-none ${
                    amount && (isBelowMinimumSwapAmount?.() || isAmountExceedsBalance?.()) 
                      ? 'text-red-400' 
                      : 'text-white'
                  }`}
                  style={{ 
                    fontSize: amount && amount.length > 15 ? '1.25rem' : 
                             amount && amount.length > 12 ? '1.5rem' : '1.75rem', 
                    lineHeight: '1',
                    boxShadow: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                />
                <div className="text-sm text-gray-400 mt-1">
                  ${(() => {
                    const result = getSwapAmountUSD?.() || 0;
                    return result.toFixed(2);
                  })() || '0.00'}
                </div>
              </>
            ) : (
              <>
                <div 
                  className="text-white overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ 
                    fontSize: amount && amount.length > 15 ? '1.25rem' : 
                             amount && amount.length > 12 ? '1.5rem' : '1.75rem'
                  }}
                >
                  {formatOutputAmount(amount)}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  ${(() => {
                    const result = getSwapAmountUSD?.() || 0;
                    return result.toFixed(2);
                  })() || '0.00'}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 relative">
            {/* Percentage Badges - Show on hover for from token */}
            {isFrom && isHovering && token && getFormattedTokenBalance(token) !== '0' && handlePercentageClick && (
              <div className="absolute -top-10 right-0 flex gap-1 z-10">
                <Button
                  onClick={() => handlePercentageClick(25)}
                  className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                  size="sm"
                >
                  25%
                </Button>
                <Button
                  onClick={() => handlePercentageClick(50)}
                  className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                  size="sm"
                >
                  50%
                </Button>
                <Button
                  onClick={() => handlePercentageClick(75)}
                  className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                  size="sm"
                >
                  75%
                </Button>
                <Button
                  onClick={() => handlePercentageClick(100)}
                  className="bg-transparent border border-gray-600 hover:bg-muted/60 text-white text-xs px-2 py-1 h-6 rounded-full transition-all duration-200"
                  size="sm"
                >
                  Max
                </Button>
              </div>
            )}
            <div className="flex flex-col items-end relative">
              <TokenSelector
                selectedToken={token}
                availableTokens={availableTokens}
                onTokenSelect={onTokenSelect}
                isOpen={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
                label={isFrom ? "From" : "To"}
                userTokens={userTokens}
                subgraphNetwork={subgraphNetwork}
                getTokenAddress={getTokenAddress}
              />
              {isFrom && (
                <div className={`text-xs mt-1 ${
                  amount && isAmountExceedsBalance?.() 
                    ? 'text-red-400' 
                    : 'text-gray-400'
                }`}>
                  {getFormattedTokenBalance(token)} {token}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 