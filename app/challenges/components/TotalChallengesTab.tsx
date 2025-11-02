'use client'

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RecentChallengesTable } from "./RecentChallengesTable"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { ethers } from 'ethers'
import { getSteleContractAddress } from "@/lib/constants"
import SteleABI from "@/app/abis/Stele.json"
import { useQueryClient } from '@tanstack/react-query'

interface TotalChallengesTabProps {
  activeTab: 'portfolio' | 'challenges'
  setActiveTab: (tab: 'portfolio' | 'challenges') => void
  selectedNetwork: 'ethereum' | 'arbitrum'
  setSelectedNetwork: (network: 'ethereum' | 'arbitrum') => void
}

export function TotalChallengesTab({ setActiveTab, selectedNetwork }: TotalChallengesTabProps) {
  const { t } = useLanguage()
  const { isConnected, getProvider } = useWallet()
  const queryClient = useQueryClient()
  const [latestChallengeIsActive, setLatestChallengeIsActive] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedChallengeType, setSelectedChallengeType] = useState<number>(0)

  const challengeTypes = [
    { id: 0, name: t('oneWeek'), duration: '1 Week' },
    { id: 1, name: t('oneMonth'), duration: '1 Month' },
    { id: 2, name: t('threeMonths'), duration: '3 Months' },
    { id: 3, name: t('sixMonths'), duration: '6 Months' },
    { id: 4, name: t('oneYear'), duration: '1 Year' },
  ]

  const handleCreateChallenge = async () => {
    if (!isConnected) {
      console.error('Wallet not connected')
      return
    }

    setIsCreating(true)
    try {
      // Get provider and signer
      const provider = await getProvider()
      if (!provider) {
        throw new Error('No provider available')
      }

      const signer = await provider.getSigner()

      // Get the correct contract address for the selected network
      const contractAddress = getSteleContractAddress(selectedNetwork)

      // Create contract instance
      const steleContract = new ethers.Contract(
        contractAddress,
        SteleABI.abi,
        signer
      )

      // Call createChallenge function
      const tx = await steleContract.createChallenge(selectedChallengeType)

      // Wait for transaction confirmation
      await tx.wait()

      // Close modal
      setShowCreateModal(false)

      // Refresh the challenges data
      await queryClient.invalidateQueries({ queryKey: ['recentChallenges'] })

    } catch (error: any) {
      console.error('Error creating challenge:', error)

      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        // User rejected transaction - exit without showing error
        return
      } else if (error.message) {
        if (error.message.includes('user denied') || error.message.includes('rejected')) {
          return
        }
      }

      console.error(`Error: ${error.message || 'Failed to create challenge'}`)
    } finally {
      setIsCreating(false)
    }
  }

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
        {/* Show +New button only when connected and latest challenge is not active */}
        {isConnected && !latestChallengeIsActive && (
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isCreating}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Title and Tab */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('portfolio')}
              className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              {t('myChallenge')}
            </button>
            <h2 className="text-2xl sm:text-3xl text-gray-100 cursor-default whitespace-nowrap">{t('totalChallenges')}</h2>
          </div>

          {/* Show +New button only when connected and latest challenge is not active */}
          {isConnected && !latestChallengeIsActive && (
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3" />
              <span className="text-xs">New</span>
            </Button>
          )}
        </div>
      </div>

      <RecentChallengesTable
        selectedNetwork={selectedNetwork}
        onLatestChallengeStatusChange={setLatestChallengeIsActive}
      />

      {/* Create Challenge Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px] bg-muted/80 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-100">Create New Challenge</DialogTitle>
            <DialogDescription className="text-base text-gray-300">
              Select the challenge duration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Challenge Type</label>
              <div className="grid grid-cols-1 gap-2">
                {challengeTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedChallengeType(type.id)}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      selectedChallengeType === type.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-400">{type.duration}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-gray-600 hover:bg-gray-700"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Challenge
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
