'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

// Loading skeleton component for dynamic imports
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

// Dynamically import client components with SSR disabled and loading fallback
const ActiveChallenges = dynamic(
  () => import("./ActiveChallenges").then(mod => ({ default: mod.ActiveChallenges })),
  { 
    ssr: false,
    loading: () => <LoadingSkeleton />
  }
)

const InvestableTokens = dynamic(
  () => import("./InvestableTokens").then(mod => ({ default: mod.InvestableTokens })),
  { 
    ssr: false,
    loading: () => <LoadingSkeleton />
  }
)

interface DashboardClientComponentsProps {
  network?: 'ethereum' | 'arbitrum' | 'solana' | null
  onNetworkChange?: (network: 'ethereum' | 'arbitrum') => void
}

export function DashboardClientComponents({ network, onNetworkChange }: DashboardClientComponentsProps) {
  const [activeTab, setActiveTab] = useState<'challenges' | 'tokens'>('challenges')
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const { t } = useLanguage()

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Sync with parent network prop
  useEffect(() => {
    if (network === 'ethereum' || network === 'arbitrum') {
      setSelectedNetwork(network)
    }
  }, [network])

  // Save network selection to localStorage when it changes
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
    // Notify parent component
    if (onNetworkChange) {
      onNetworkChange(network)
    }
  }

  return (
    <>
      {activeTab === 'challenges' ? (
        <ActiveChallenges 
          showCreateButton={true} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={handleNetworkChange}
        />
      ) : (
        <InvestableTokens 
          network={selectedNetwork} 
          setActiveTab={setActiveTab}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={handleNetworkChange}
        />
      )}
    </>
  )
} 