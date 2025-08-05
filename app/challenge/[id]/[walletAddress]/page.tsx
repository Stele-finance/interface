"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/app/hooks/useWallet"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

// Import types
import { InvestorPageProps } from "./types"

export default function InvestorPage({ params }: InvestorPageProps) {
  const { id: challengeId, walletAddress } = use(params)
  const router = useRouter()
  const { network } = useWallet()
  const { t } = useLanguage()
  
  useEffect(() => {
    // Filter network to supported types for subgraph (exclude 'solana')
    const targetNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
    
    // Redirect to network-specific route
    router.replace(`/${targetNetwork}/challenge/${challengeId}/${walletAddress}`)
  }, [challengeId, walletAddress, network, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
        <div className="text-white text-lg font-medium">{t('loadingChallengeData')}</div>
      </div>
    </div>
  )
} 