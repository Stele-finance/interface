'use client'

import { useState, useEffect } from "react"
import { MyFundsTab } from "./MyFundsTab"
import { TotalFundsTab } from "./TotalFundsTab"

export function FundsClientComponents() {
  const [activeTab, setActiveTab] = useState<'my-funds' | 'all-funds'>('my-funds')
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }
  }, [])

  // Listen for network changes from navbar
  useEffect(() => {
    const handleNetworkChanged = (event: CustomEvent) => {
      const { network } = event.detail
      if (network === 'ethereum' || network === 'arbitrum') {
        setSelectedNetwork(network)
      }
    }

    window.addEventListener('networkChanged', handleNetworkChanged as EventListener)

    return () => {
      window.removeEventListener('networkChanged', handleNetworkChanged as EventListener)
    }
  }, [])

  // Save network selection to localStorage when it changes
  const handleNetworkChange = (network: 'ethereum' | 'arbitrum') => {
    setSelectedNetwork(network)
    localStorage.setItem('selected-network', network)
  }

  return (
    <>
      <div style={{ display: activeTab === 'my-funds' ? 'block' : 'none' }}>
        <MyFundsTab
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={handleNetworkChange}
        />
      </div>
      <div style={{ display: activeTab === 'all-funds' ? 'block' : 'none' }}>
        <TotalFundsTab
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={handleNetworkChange}
        />
      </div>
    </>
  )
}
