"use client"

import { use } from "react"
import { FundDetail } from "./components/FundDetail"
// Mock fund hook instead of useChallenge
// import { useFund } from '@/app/hooks/useFund'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { ArrowLeft } from 'lucide-react'

interface FundPageProps {
  params: Promise<{
    network: string
    id: string
  }>
}

function FundContent({ fundId, network }: { fundId: string; network: string }) {
  const router = useRouter()
  const { t } = useLanguage()
  
  // Filter network to supported types for subgraph (exclude 'solana')
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'ethereum'
  
  // Mock fund data instead of useChallenge
  const mockFund = {
    id: fundId,
    name: `Fund ${fundId}`,
    fundId: fundId,
    manager: '0x1234567890123456789012345678901234567890',
    investorCount: 15,
    tvl: 72000,
    totalValue: '$72,000',
    status: 'active',
    network: subgraphNetwork,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    tokens: ['USDC', 'ETH', 'WBTC']
  }
  
  const data = { fund: mockFund }
  const isLoading = false
  const error = null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
          <div className="text-white text-lg font-medium">Loading fund data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error loading fund data</h3>
          <p className="text-sm">Failed to load fund data</p>
        </div>
      </div>
    )
  }

  if (!data?.fund) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">
          <h3 className="text-lg font-semibold mb-2">Fund not found</h3>
          <p className="text-sm">The fund with ID "{fundId}" could not be found.</p>
        </div>
      </div>
    )
  }

  // For now, we'll just pass fundId to maintain compatibility with existing FundDetail
  // Later, we can modify FundDetail to accept fund data as props if needed
  return (
    <div className="space-y-8">
      {/* Back to Dashboard Button */}
      <div className="px-2 sm:px-0 -mt-8">
        <button 
          onClick={() => router.push('/dashboard/fund')}
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('dashboard')}
        </button>
      </div>
      
      {/* Fund Detail Component */}
      <FundDetail fundId={fundId} network={network} />
    </div>
  )
}

export default function FundPage({ params }: FundPageProps) {
  const { network, id } = use(params)
  
  return (
    <div className="container mx-auto p-2 py-12">
      <div className="max-w-6xl mx-auto space-y-4">
        <FundContent fundId={id} network={network} />
      </div>
    </div>
  )
}