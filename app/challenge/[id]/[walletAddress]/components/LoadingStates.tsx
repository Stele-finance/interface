import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface LoadingStateProps {
  challengeId: string
  walletAddress: string
}

export function MainLoadingState({ challengeId }: { challengeId: string }) {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 py-20">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Back Button Loading */}
        <div className="mb-6">
          <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Challenge Info Loading */}
        <div className="mb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
          </div>
        </div>
        
        {/* Header Loading */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-end gap-4">
              <div className="h-14 bg-gray-700 rounded-lg w-24 animate-pulse"></div>
              <div className="h-14 bg-gray-700 rounded-lg w-28 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Charts + Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chart Loading */}
            <div className="h-80 bg-gray-700 rounded-lg animate-pulse"></div>
            
            {/* Tabs Loading */}
            <div className="space-y-4">
              <div className="flex w-full">
                <div className="h-10 bg-gray-700 rounded-l w-1/2 animate-pulse"></div>
                <div className="h-10 bg-gray-600 rounded-r w-1/2 animate-pulse"></div>
              </div>
              
              {/* Tab Content Loading */}
              <Card className="bg-transparent border border-gray-700/50">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Side - Portfolio Summary */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Portfolio Summary Loading */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Type and Status Loading */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Type Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    
                    {/* Status Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse"></div>
                        <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Value Loading */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                    <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Info Loading */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Challenge and Seed Money Loading */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Challenge Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
                    </div>

                    {/* Seed Money Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Progress Loading */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-700 rounded w-36 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ErrorState({ challengeId, walletAddress }: LoadingStateProps) {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 py-20">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Go to Challenge Button */}
        <div className="mb-4">
          <button 
            onClick={() => router.push(`/challenge/${challengeId}`)}
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-3 px-4 -mx-4 rounded-md hover:bg-gray-800/30 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('goToChallenge')} {challengeId}
          </button>
        </div>
        
        {/* Loading Message for New Investors */}
        <div className="text-center py-12">
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg px-8 py-12 max-w-lg mx-auto">
            <Loader2 className="h-12 w-12 mx-auto mb-6 animate-spin text-blue-400" />
            <h3 className="text-xl font-medium text-blue-400 mb-4">{t('loadingInvestorData')}</h3>
            <p className="text-gray-400 text-sm">
              {t('dataUpdateInProgress')}
            </p>
            
            {/* Show wallet address being loaded */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">{t('investor')}</p>
              <p className="text-gray-200 font-mono text-base">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Skeleton Loading for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Side - Charts + Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chart Loading */}
            <div className="h-80 bg-gray-700 rounded-lg animate-pulse"></div>
            
            {/* Tabs Loading */}
            <div className="space-y-4">
              <div className="flex w-full">
                <div className="h-10 bg-gray-700 rounded-l w-1/2 animate-pulse"></div>
                <div className="h-10 bg-gray-600 rounded-r w-1/2 animate-pulse"></div>
              </div>
              
              {/* Tab Content Loading */}
              <Card className="bg-transparent border border-gray-700/50">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Side - Portfolio Summary */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Portfolio Summary Loading */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Type and Status Loading */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Type Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    
                    {/* Status Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse"></div>
                        <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Value Loading */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                    <div className="h-10 bg-gray-700 rounded w-48 animate-pulse"></div>
                  </div>

                </CardContent>
              </Card>

              {/* Challenge Info Loading */}
              <Card className="bg-muted border-0 rounded-2xl">
                <CardContent className="p-8 space-y-8">
                  {/* Row 1: Challenge and Seed Money Loading */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Challenge Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-4 animate-pulse"></div>
                    </div>

                    {/* Seed Money Loading */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Progress Loading */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-700 rounded w-36 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 