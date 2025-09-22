import React from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface FundErrorStateProps {
  fundId: string
  walletAddress: string
  routeNetwork?: string
}

export function FundErrorState({ fundId, walletAddress, routeNetwork = 'arbitrum' }: FundErrorStateProps) {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 py-20">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Go to Fund Button */}
        <div className="mb-4">
          <button 
            onClick={() => router.push(`/fund/${routeNetwork}/${fundId}`)}
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Go to Fund {fundId}
          </button>
        </div>
        
        {/* Loading Message for New Investors */}
        <div className="text-center py-12">
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg px-8 py-12 max-w-lg mx-auto">
            <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-blue-400" />
            <h3 className="text-xl font-medium text-blue-400 mb-4">Loading Fund Investor Data</h3>
            <p className="text-gray-400 text-sm">
              Data update in progress...
            </p>
            
            {/* Show wallet address being loaded */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Investor</p>
              <p className="text-gray-200 font-mono text-base">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}