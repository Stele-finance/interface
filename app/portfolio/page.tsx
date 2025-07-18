"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Wallet, Loader2 } from "lucide-react"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { getWalletLogo } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import Image from "next/image"

export default function PortfolioPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, isConnected, connectWallet } = useWallet()
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    // If wallet is already connected, redirect to portfolio page
    if (isConnected && address) {
      router.push(`/portfolio/${address}`)
    }
  }, [isConnected, address, router])

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      await connectWallet() // No parameters needed - WalletConnect only
      setWalletSelectOpen(false)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      alert(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('myPortfolio')}</h1>
          </div>

          <Card className="bg-muted border-gray-700/50">
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
                  
                  <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Wallet className="mr-2 h-4 w-4" />
                        {t('connectWallet')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-muted/80 border-gray-600">
                      <DialogHeader>
                        <DialogTitle>{t('connectWallet')}</DialogTitle>
                        <DialogDescription>
                          {t('selectWalletToConnect')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4 py-4">
                        {/* PC version: Show MetaMask, Phantom, WalletConnect */}
                        {!isMobile && (
                          <>
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-16 flex items-center justify-start gap-4 p-4 bg-muted/40 border-gray-600 hover:bg-muted/60"
                              onClick={() => handleConnectWallet()}
                              disabled={isConnecting}
                            >
                              <Image 
                                src={getWalletLogo('walletconnect')} 
                                alt="WalletConnect"
                                width={24}
                                height={24}
                                style={{ width: 'auto', height: '24px' }}
                              />
                              <div className="text-left">
                                <div className="font-semibold">WalletConnect</div>
                                <div className="text-sm text-muted-foreground">
                                  {t('browserExtension')}
                                </div>
                              </div>
                            </Button>
                          </>
                        )}

                        {/* Mobile version: Show WalletConnect only */}
                        {isMobile && (
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-16 flex items-center justify-start gap-4 p-4 bg-muted/40 border-gray-600 hover:bg-muted/60"
                            onClick={() => handleConnectWallet()}
                            disabled={isConnecting}
                          >
                            <Image 
                              src={getWalletLogo('walletconnect')} 
                              alt="WalletConnect"
                              width={24}
                              height={24}
                              style={{ width: 'auto', height: '24px' }}
                            />
                            <div className="text-left">
                              <div className="font-semibold">WalletConnect</div>
                              <div className="text-sm text-muted-foreground">Connect Mobile Wallet</div>
                            </div>
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 