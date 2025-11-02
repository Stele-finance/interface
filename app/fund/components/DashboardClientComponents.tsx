'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from "react"

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
const Funds = dynamic(
  () => import("./Funds").then(mod => ({ default: mod.Funds })),
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
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')

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
    <Funds
      showCreateButton={true}
      selectedNetwork={selectedNetwork}
      setSelectedNetwork={handleNetworkChange}
    />
  )
} 