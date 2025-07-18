'use client'

import dynamic from 'next/dynamic'
import { Suspense } from "react"

// Dynamically import client components with SSR disabled
const ActiveChallenges = dynamic(
  () => import("@/components/active-challenges").then(mod => ({ default: mod.ActiveChallenges })),
  { ssr: false }
)

const InvestableTokens = dynamic(
  () => import("@/components/investable-tokens").then(mod => ({ default: mod.InvestableTokens })),
  { ssr: false }
)

const TotalRanking = dynamic(
  () => import("@/components/total-ranking").then(mod => ({ default: mod.TotalRanking })),
  { ssr: false }
)

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-gray-700 animate-pulse rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-700 animate-pulse rounded" />
        <div className="h-64 bg-gray-700 animate-pulse rounded" />
      </div>
    </div>
  )
}

interface DashboardClientComponentsProps {
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
}

export function DashboardClientComponents({ network }: DashboardClientComponentsProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ActiveChallenges showCreateButton={true} />
      <div className="mt-6 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-16">
        <InvestableTokens network={network} />
        <TotalRanking network={network} />
      </div>
    </Suspense>
  )
} 