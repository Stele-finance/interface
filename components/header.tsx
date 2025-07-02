"use client"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { Home, Trophy, BarChart3, Vote } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bell, Search, User, Wallet, DollarSign, Menu, Github, FileText, Twitter, Languages } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ethers } from "ethers"
import { 
  ETHEREUM_CHAIN_ID, 
  ETHEREUM_CHAIN_CONFIG, 
  STELE_CONTRACT_ADDRESS,
  USDC_DECIMALS
} from "@/lib/constants"
import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelectorSidebar } from "./language-selector-sidebar"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

type WalletType = 'metamask' | 'phantom' | null

export function Header() {
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  
  // Use global wallet hook
  const { address: walletAddress, isConnected, network: walletNetwork, connectWallet, disconnectWallet, switchNetwork, walletType } = useWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [challengesDropdownOpen, setChallengesDropdownOpen] = useState(false)
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  
  // Get entry fee from context
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee()

  // Get wallet icon based on wallet type
  const getWalletIcon = () => {
    switch (walletType) {
      case 'metamask':
        return "/wallets/metamask.png"
      case 'phantom':
        return "/wallets/phantom.png"
      default:
        return null
    }
  }

  // Get network icon based on network type
  const getNetworkIcon = () => {
    switch (walletNetwork) {
      case 'ethereum':
        return "/networks/ethereum.png"
      case 'arbitrum':
        return "/networks/arbitrum.png"
      default:
        return null
    }
  }

  // Get symbol and chain name based on network
  const getNetworkInfo = () => {
    switch (walletNetwork) {
      case 'ethereum':
        return { symbol: 'ETH', name: 'Ethereum Mainnet' };
      case 'arbitrum':
        return { symbol: 'ETH', name: 'Arbitrum' };
      default:
        return { symbol: '', name: '' };
    }
  };

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    try {
      setIsLoadingBalance(true);
      
      if (walletNetwork === 'solana') {
        // Get Solana balance
        if (window.phantom?.solana) {
          // For Solana, separate API call is needed (using arbitrary value for simplification)
          // In practice, we would use Solana Web3.js to call getBalance
          setBalance('1.234');
        }
      } else {
        // Get Ethereum/Base balance
        const provider = walletType === 'metamask' ? (window as any).ethereum : window.phantom?.ethereum
        
        if (provider) {
          const balanceHex = await provider.request({
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
          });
          
          // Convert from Wei to ETH (1 ETH = 10^18 Wei)
          const balanceInWei = parseInt(balanceHex, 16);
          const balanceInEth = balanceInWei / Math.pow(10, 18);
          
          // Display up to 4 decimal places
          setBalance(balanceInEth.toFixed(4));
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance('?');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConnectWallet = async (selectedWalletType: WalletType) => {
    if (!selectedWalletType) return
    
    try {
      setIsConnecting(true)
      await connectWallet(selectedWalletType)
      setWalletSelectOpen(false)
    } catch (error) {
      console.error("Wallet connection error:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectWallet = () => {
    setBalance('0')
    disconnectWallet()
  }

  // Switch between Networks
  const switchWalletNetwork = async (targetNetwork: 'solana' | 'ethereum' | 'arbitrum') => {
    // Immediate validation before any async operations
    if (targetNetwork === 'arbitrum' && walletType === 'phantom') {
      toast({
        variant: "destructive",
        title: "🚫 Network Not Supported",
        description: "Phantom wallet does not support Arbitrum network. Please disconnect and connect with MetaMask to access Arbitrum.",
        duration: 5000,
      })
      return
    }
    
    try {
      setIsConnecting(true)
      
      await switchNetwork(targetNetwork)
      
      // Success feedback
      toast({
        variant: "default",
        title: "✅ Network Switched",
        description: `Successfully switched to ${targetNetwork === 'ethereum' ? 'Ethereum Mainnet' : 'Arbitrum One'}`,
        duration: 3000,
      })
      
    } catch (error) {
      console.error("Wallet switch error:", error)
      // Show user-friendly error message
      let title = "Network Switch Failed"
      let description = "Failed to switch network. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("cancelled by user")) {
          title = "Network Switch Cancelled"
          description = "You cancelled the network switch request."
        } else if (error.message.includes("manually")) {
          title = "Manual Action Required"
          description = error.message
        } else if (error.message.includes("not support")) {
          title = "Network Not Supported"
          description = error.message
        } else {
          description = error.message
        }
      }
      
      toast({
        variant: "destructive",
        title,
        description,
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // Fetch new balance when wallet address or network changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, walletNetwork]);

  const { symbol, name } = getNetworkInfo();
  const walletIcon = getWalletIcon();

  return (
    <header className="sticky top-0 z-30 border-b border-border h-20 flex items-center justify-between px-4 md:px-6 bg-background">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <img 
            src="/stele_logo.png" 
            alt="Stele Logo" 
            className="h-10 w-auto object-contain"
          />
        </Link>
        
        <div className="flex items-center">
          <Link href={"/dashboard"} className="mr-6">
            <div 
              className={cn(
                "flex flex-row items-center font-medium text-lg transition-colors",
                pathname === "/" || pathname === "/dashboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{t('dashboard')}</span>
            </div>
          </Link>
          <div 
            className="mr-6 relative"
            onMouseEnter={() => setChallengesDropdownOpen(true)}
            onMouseLeave={() => setChallengesDropdownOpen(false)}
          >
            <div 
              className={cn(
                "flex flex-row items-center font-medium text-lg transition-colors cursor-pointer",
                pathname.includes("/challenges") || pathname.includes("/challenge/") || pathname.includes("/portfolio")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{t('challenges')}</span>
            </div>
            {challengesDropdownOpen && (
              <div className="absolute top-full left-0 -mt-1 w-52 z-50 pt-2">
                {/* Invisible bridge area */}
                <div className="h-1 w-full"></div>
                <div className="space-y-1 p-1 bg-background border border-gray-600 rounded-2xl shadow-xl">
                  <Link 
                    href="/portfolio"
                    className="block px-3 py-2 text-lg text-white bg-transparent hover:bg-gray-700/30 border border-gray-600 rounded-2xl transition-all duration-200 font-medium shadow-lg"
                  >
                    {t('myPortfolios')}
                  </Link>
                  <Link 
                    href="/challenges"
                    className="block px-3 py-2 text-lg text-white bg-transparent hover:bg-gray-700/30 border border-gray-600 rounded-2xl transition-all duration-200 font-medium shadow-lg"
                  >
                    {t('totalChallenges')}
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link href={"/vote"} className="mr-6">
            <div 
              className={cn(
                "flex flex-row items-center font-medium text-lg transition-colors",
                pathname.includes("/vote") 
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{t('vote')}</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        
        {walletAddress ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end px-3 py-2">
              <div className="flex items-center gap-2">
                {getNetworkIcon() && (
                  <Image 
                    src={getNetworkIcon()!} 
                    alt={`${walletNetwork} network`}
                    width={16}
                    height={16}
                    className="rounded-full"
                    style={{ width: 'auto', height: '16px' }}
                  />
                )}
                <span className="text-sm font-medium text-gray-300">{name}</span>
              </div>
              <span className="text-base font-semibold text-white">
                {isLoadingBalance ? (
                  <span className="text-gray-400">{t('loading')}</span>
                ) : (
                  `${balance} ${symbol}`
                )}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="text-primary border-primary hover:bg-primary/10 hidden sm:flex font-medium px-4 py-2 h-auto">
                  {walletIcon ? (
                    <Image 
                      src={walletIcon} 
                      alt={`${walletType} wallet`}
                      width={20}
                      height={20}
                      className="mr-2"
                      style={{ width: 'auto', height: '20px' }}
                    />
                  ) : (
                    <Wallet className="mr-2 h-5 w-5" />
                  )}
                  <span className="text-base">
                    {walletNetwork === 'solana'
                      ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                      : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    }
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-base font-semibold">{name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {isLoadingBalance ? t('loading') : `${balance} ${symbol}`}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(walletAddress)
                }}>
                  {t('copyAddress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={fetchBalance}>
                  {t('refreshBalance')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('switchNetwork')}</DropdownMenuLabel>
                {walletNetwork !== 'ethereum' && (
                  <DropdownMenuItem onClick={() => switchWalletNetwork('ethereum')}>
                    {t('ethereumMainnet')}
                  </DropdownMenuItem>
                )}
                {walletNetwork !== 'arbitrum' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem 
                            onClick={() => switchWalletNetwork('arbitrum')}
                            disabled={walletType === 'phantom'}
                            className={walletType === 'phantom' ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>Arbitrum One</span>
                              {walletType === 'phantom' && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  🚫
                                </span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      {walletType === 'phantom' && (
                        <TooltipContent>
                          <p>Arbitrum is not supported by Phantom wallet.</p>
                          <p>Please use MetaMask to access Arbitrum network.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnectWallet}>
                  {t('disconnect')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-primary border-primary hover:bg-primary/10 hidden sm:flex font-medium px-4 py-2 h-auto"
              >
                <Wallet className="mr-2 h-5 w-5" />
                <span className="text-base">
                  {t('connectWallet')}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('connectWallet')}</DialogTitle>
                <DialogDescription>
                  Select a wallet to connect
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 flex items-center justify-start gap-4 p-4"
                  onClick={() => handleConnectWallet('metamask')}
                  disabled={isConnecting}
                >
                  <Image 
                    src="/wallets/metamask.png" 
                    alt="MetaMask"
                    width={32}
                    height={32}
                    style={{ width: 'auto', height: '32px' }}
                  />
                  <div className="text-left">
                    <div className="font-semibold">MetaMask</div>
                    <div className="text-sm text-muted-foreground">Browser Extension</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 flex items-center justify-start gap-4 p-4"
                  onClick={() => handleConnectWallet('phantom')}
                  disabled={isConnecting}
                >
                  <Image 
                    src="/wallets/phantom.png" 
                    alt="Phantom"
                    width={32}
                    height={32}
                    style={{ width: 'auto', height: '32px' }}
                  />
                  <div className="text-left">
                    <div className="font-semibold">Phantom</div>
                    <div className="text-sm text-muted-foreground">Browser Extension</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex items-center gap-2">
          {/* Language Selector Sidebar */}
          <LanguageSelectorSidebar>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Languages className="h-6 w-6" />
            </Button>
          </LanguageSelectorSidebar>

          {/* Menu Dropdown for Links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="h-7 w-7" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-base w-48">
              <DropdownMenuLabel className="text-lg font-semibold">{t('links')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-base py-2" asChild>
                <Link href="https://github.com/Stele-finance/interface" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  {t('github')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base py-2" asChild>
                <Link href="#" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('doc')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base py-2" asChild>
                <Link href="https://x.com/stelefinance" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  X
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
