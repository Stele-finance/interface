"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Loader2 } from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"

export default function PortfolioPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, isConnected, connectWallet } = useWallet()

  useEffect(() => {
    // If wallet is already connected, redirect to portfolio page
    if (isConnected && address) {
      router.push(`/portfolio/${address}`)
    }
  }, [isConnected, address, router])

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      alert(error.message || "Failed to connect wallet")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('myPortfolio')}</h1>
            <p className="text-gray-400">
              {t('connectToViewPortfolio')}
            </p>
          </div>

          <Card className="bg-gray-900/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-center text-gray-100">{t('connectWallet')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Wallet className="h-16 w-16 text-gray-400" />
              </div>
              
              {isConnected && address ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">{t('connectedWallet')}</p>
                  <p className="font-mono text-gray-100">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-400">{t('redirecting')}</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-gray-400">
                    {t('connectToAccess')}
                  </p>
                  
                  <Button 
                    onClick={handleConnectWallet}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('connectPhantomWallet')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 