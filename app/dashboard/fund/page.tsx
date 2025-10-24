'use client'

import { DashboardClientComponents } from "./components/DashboardClientComponents"
import { DashboardCharts } from "./components/DashboardCharts"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Handle network change from child components
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
  }

  return (
    <div className="w-full mx-auto px-3 py-0 sm:px-6 sm:py-2 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-4">
        <DashboardCharts network={selectedNetwork} />
        <div className="mt-4 sm:mt-6">
          <DashboardClientComponents
            network={selectedNetwork}
            onNetworkChange={handleNetworkChange}
          />
        </div>
      </div>
    </div>
  )
} 