'use client'

import { useLanguage } from "@/lib/language-context"
import { RecentChallengesTable } from "./RecentChallengesTable"

interface TotalChallengesTabProps {
  activeTab: 'portfolio' | 'challenges'
  setActiveTab: (tab: 'portfolio' | 'challenges') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function TotalChallengesTab({ setActiveTab, selectedNetwork }: TotalChallengesTabProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4 mt-8">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="text-3xl text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('myChallenge')}
          </button>
          <h2 className="text-3xl text-gray-100 cursor-default">{t('totalChallenges')}</h2>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            {t('myChallenge')}
          </button>
          <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('totalChallenges')}</h2>
        </div>
      </div>

      <RecentChallengesTable selectedNetwork={selectedNetwork} />
    </div>
  )
}