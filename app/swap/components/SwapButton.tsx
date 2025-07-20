"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { SwapButtonProps } from "./types"

export function SwapButton({
  fromAmount,
  fromToken,
  toToken,
  isDataReady,
  isSwapping,
  isAmountExceedsBalance,
  isBelowMinimumSwapAmount,
  onSwap,
  t
}: SwapButtonProps) {
  const isDisabled = (() => {
    const conditions = {
      noFromAmount: !fromAmount,
      invalidAmount: parseFloat(fromAmount) <= 0,
      noFromToken: !fromToken,
      noToToken: !toToken,
      dataNotReady: !isDataReady,
      isSwapping: isSwapping,
      exceedsBalance: isAmountExceedsBalance(),
      belowMinimum: isBelowMinimumSwapAmount()
    };
    
    return Object.values(conditions).some(condition => condition);  
  })();

  const getButtonText = () => {
    if (isSwapping) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('swapping')}
        </div>
      );
    }
    
    if (!isDataReady) {
      return t('loadingData');
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
      return t('enterAmount');
    }
    
    if (isAmountExceedsBalance()) {
      return t('insufficientBalance');
    }
    
    if (isBelowMinimumSwapAmount()) {
      return t('minimumAmountRequired');
    }
    
    return t('swap');
  };

  return (
    <Button 
      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white font-semibold h-14 rounded-2xl mt-4 border-orange-500 hover:border-orange-600 disabled:border-orange-500/50" 
      size="lg"
      onClick={onSwap}
      disabled={isDisabled}
    >
      {getButtonText()}
    </Button>
  );
} 