"use client"

import { useLanguage } from "@/lib/language-context"
import { SwapQuote, SimpleSwapQuote } from "./types"

interface ExchangeRateProps {
  isDataReady: boolean;
  fromToken: string;
  toToken: string;
  swapQuote: SwapQuote | null;
  simpleSwapQuote: SimpleSwapQuote | null;
  getTokenDecimals: (symbol: string) => number;
}

export function ExchangeRate({
  isDataReady,
  fromToken,
  toToken,
  swapQuote,
  simpleSwapQuote,
  getTokenDecimals
}: ExchangeRateProps) {
  const { t } = useLanguage()
  
  // Show if using basic estimate
  const isUsingBasicEstimate = !swapQuote && simpleSwapQuote;
  
  if (!isDataReady || !fromToken || !toToken || (!swapQuote && !simpleSwapQuote)) {
    return null;
  }

  const exchangeRate = swapQuote ? swapQuote.exchangeRate : simpleSwapQuote?.exchangeRate || 0;

  return (
    <div className="text-center text-sm text-gray-400">
      1 {fromToken} = {exchangeRate.toFixed(Math.min(6, getTokenDecimals(toToken)))} {toToken}
      {isUsingBasicEstimate && (
        <span className="text-orange-400 ml-1">({t('loadingPrice')})</span>
      )}
    </div>
  );
} 