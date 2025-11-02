"use client"

import { use } from "react"
import { createPortal } from "react-dom"
import { ChallengePortfolio } from "./components/ChallengePortfolio"
import { useChallenge } from '@/app/hooks/useChallenge'
import { useWallet } from '@/app/hooks/useWallet'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { ArrowLeft } from 'lucide-react'

interface ChallengePageProps {
  params: Promise<{
    network: string
    id: string
  }>
}

function ChallengeContent({ challengeId, network }: { challengeId: string; network: string }) {
  const router = useRouter()
  const { t } = useLanguage()
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  const { data, isLoading, error } = useChallenge(challengeId, subgraphNetwork)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
          <div className="text-white text-lg font-medium">{t('loadingChallengeData')}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error loading challenge data</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!data?.challenge) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">
          <h3 className="text-lg font-semibold mb-2">Challenge not found</h3>
          <p className="text-sm">The challenge with ID &quot;{challengeId}&quot; could not be found.</p>
        </div>
      </div>
    )
  }

  // For now, we'll just pass challengeId to maintain compatibility with existing ChallengePortfolio
  // Later, we can modify ChallengePortfolio to accept challenge data as props if needed
  return (
    <div className="space-y-8">
      {/* Back to Challenges Button */}
      <div className="px-2 sm:px-0 -mt-8">
        <button
          onClick={() => router.push('/challenges')}
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('challenges')}
        </button>
      </div>
      
      {/* Challenge Portfolio Component */}
      <ChallengePortfolio challengeId={challengeId} network={network} />
    </div>
  )
}

export default function ChallengePage({ params }: ChallengePageProps) {
  const { network, id } = use(params)
  
  return (
    <div className="container mx-auto p-2 py-12">
      <div className="max-w-6xl mx-auto space-y-4">
        <ChallengeContent challengeId={id} network={network} />
      </div>
    </div>
  )
} 