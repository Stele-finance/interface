"use client"

import { use } from "react"
import { ChallengePortfolio } from "@/components/challenge-portfolio"
import { useChallenge } from '@/app/hooks/useChallenge'
import { useWallet } from '@/app/hooks/useWallet'

interface ChallengePageProps {
  params: Promise<{
    id: string
  }>
}

function ChallengeContent({ challengeId }: { challengeId: string }) {
  const { network } = useWallet()
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  const { data, isLoading, error } = useChallenge(challengeId, subgraphNetwork)

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
          <div className="text-white text-lg font-medium">Loading challenge data...</div>
          <div className="text-gray-300 text-sm">Please wait while we fetch the data</div>
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
          <p className="text-sm">The challenge with ID "{challengeId}" could not be found.</p>
        </div>
      </div>
    )
  }

  // For now, we'll just pass challengeId to maintain compatibility with existing ChallengePortfolio
  // Later, we can modify ChallengePortfolio to accept challenge data as props if needed
  return <ChallengePortfolio challengeId={challengeId} />
}

export default function ChallengePage({ params }: ChallengePageProps) {
  const { id } = use(params)
  
  return (
    <div className="container mx-auto p-6 py-20">
      <div className="max-w-6xl mx-auto space-y-4">
        <ChallengeContent challengeId={id} />
      </div>
    </div>
  )
} 