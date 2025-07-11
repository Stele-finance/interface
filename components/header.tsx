"use client"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Home, Trophy, BarChart3, Vote } from "lucide-react"
import { cn, getNetworkLogo, getWalletLogo } from "@/lib/utils"
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
  USDC_DECIMALS,
  getRPCUrl
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
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  
  // Use global wallet hook
  const { address: walletAddress, isConnected, network: walletNetwork, connectWallet, disconnectWallet, switchNetwork, walletType } = useWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [challengesDropdownOpen, setChallengesDropdownOpen] = useState(false)
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Track previous network and wallet address for detecting changes
  const prevNetworkRef = useRef<string | null>(null)
  const prevWalletAddressRef = useRef<string | null>(null)
  
  // Get entry fee from context
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee()

  // Get wallet icon based on wallet type
  const getWalletIcon = () => {
    switch (walletType) {
      case 'metamask':
        return getWalletLogo('metamask')
      case 'phantom':
        return getWalletLogo('phantom')
      default:
        return null
    }
  }

  // Get network icon based on network type
  const getNetworkIcon = () => {
    switch (walletNetwork) {
      case 'ethereum':
        return getNetworkLogo('ethereum')
      case 'arbitrum':
        return getNetworkLogo('arbitrum')
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

  // Fetch wallet balance using network-specific RPC
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
        // Use network-specific RPC URL for accurate balance
        const networkToUse = walletNetwork === 'ethereum' || walletNetwork === 'arbitrum' ? walletNetwork : 'ethereum';
        const rpcUrl = getRPCUrl(networkToUse);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Get ETH balance using ethers provider
        const balanceWei = await provider.getBalance(walletAddress);
        const balanceInEth = parseFloat(ethers.formatEther(balanceWei));
        
        // Display up to 4 decimal places
        setBalance(balanceInEth.toFixed(4));
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
        title: `🚫 ${t('networkNotSupported')}`,
        description: t('phantomDoesNotSupportArbitrum'),
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
        title: `✅ ${t('networkSwitched')}`,
        description: targetNetwork === 'ethereum' ? t('successfullySwitchedToEthereum') : t('successfullySwitchedToArbitrum'),
        duration: 3000,
      })
      
    } catch (error) {
      console.error("Wallet switch error:", error)
      // Show user-friendly error message
      let title = t('networkSwitchFailed')
      let description = "Failed to switch network. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("cancelled by user")) {
          title = t('networkSwitchCancelled')
          description = t('youCancelledNetworkSwitch')
        } else if (error.message.includes("manually")) {
          title = t('manualActionRequired')
          description = error.message
        } else if (error.message.includes("not support")) {
          title = t('networkNotSupported')
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

  // Navigate to dashboard when network changes
  useEffect(() => {
    // Skip on initial load (when prevNetworkRef is null)
    if (prevNetworkRef.current === null) {
      prevNetworkRef.current = walletNetwork;
      return;
    }

    // Only navigate if network actually changed and not already on dashboard
    if (prevNetworkRef.current !== walletNetwork && !pathname.includes('/dashboard')) {
      prevNetworkRef.current = walletNetwork;
      router.push('/dashboard');
    } else {
      prevNetworkRef.current = walletNetwork;
    }
  }, [walletNetwork, pathname, router]);

  // Navigate to dashboard when wallet address changes
  useEffect(() => {
    // Skip on initial load (when prevWalletAddressRef is null)
    if (prevWalletAddressRef.current === null) {
      prevWalletAddressRef.current = walletAddress;
      return;
    }

    // Only navigate if wallet address actually changed and not already on dashboard
    // Also skip if wallet is being disconnected (walletAddress becomes null)
    if (prevWalletAddressRef.current !== walletAddress && 
        walletAddress !== null && 
        !pathname.includes('/dashboard')) {
      prevWalletAddressRef.current = walletAddress;
      router.push('/dashboard');
    } else {
      prevWalletAddressRef.current = walletAddress;
    }
  }, [walletAddress, pathname, router]);

  const { symbol, name } = getNetworkInfo();
  const walletIcon = getWalletIcon();

  return (
    <header className="sticky top-0 z-30 border-b border-border h-20 flex items-center justify-between px-4 md:px-6 bg-background">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2 mr-3 sm:mr-6">
          <Image 
            src="/stele_logo_small.png" 
            alt="Stele Logo" 
            width={40}
            height={40}
            priority
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            style={{ 
              width: 'auto', 
              height: '40px',
              maxWidth: '48px'
            }}
          />
        </Link>
        
        {/* Mobile Menu Icon - Hidden on desktop */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 md:hidden"
        >
          <Menu className="h-10 w-10" />
        </Button>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/" || pathname === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            {t('dashboard')}
          </Link>
          
          <DropdownMenu open={challengesDropdownOpen} onOpenChange={setChallengesDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.includes("/challenges") || pathname.includes("/challenge/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Trophy className="h-4 w-4" />
                {t('challenges')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
               <DropdownMenuItem asChild>
                 <Link href="/portfolio" className="cursor-pointer">
                   {t('myPortfolio')}
                 </Link>
               </DropdownMenuItem>
               <DropdownMenuItem asChild>
                 <Link href="/challenges" className="cursor-pointer">
                   {t('totalChallenges')}
                 </Link>
               </DropdownMenuItem>
             </DropdownMenuContent>
          </DropdownMenu>
          
          <Link 
            href="/vote"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.includes("/vote")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Vote className="h-4 w-4" />
            {t('vote')}
          </Link>
        </nav>
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
                <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10 font-medium px-2 sm:px-4 py-2 h-auto text-xs sm:text-base">
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
                    <div className="flex items-center gap-2">
                      <Image 
                        src={getNetworkLogo('ethereum')} 
                        alt="Ethereum Mainnet"
                        width={16}
                        height={16}
                        className="rounded-full"
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{t('ethereumMainnet')}</span>
                    </div>
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
                              <div className="flex items-center gap-2">
                                <Image 
                                  src={getNetworkLogo('arbitrum')} 
                                  alt="Arbitrum One"
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                  style={{ width: '16px', height: '16px' }}
                                />
                              <span>Arbitrum</span>
                              </div>
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
                          <p>{t('arbitrumNotSupportedByPhantom')}</p>
                          <p>{t('pleaseUseMetaMaskForArbitrum')}</p>
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
                size="sm" 
                className="text-primary border-primary hover:bg-primary/10 font-medium px-2 sm:px-4 py-2 h-auto text-xs sm:text-base"
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
                  {t('selectWalletToConnect')}
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
                    src={getWalletLogo('metamask')} 
                    alt="MetaMask"
                    width={32}
                    height={32}
                    style={{ width: 'auto', height: '32px' }}
                  />
                  <div className="text-left">
                    <div className="font-semibold">MetaMask</div>
                    <div className="text-sm text-muted-foreground">{t('browserExtension')}</div>
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
                    src={getWalletLogo('phantom')} 
                    alt="Phantom"
                    width={32}
                    height={32}
                    style={{ width: 'auto', height: '32px' }}
                  />
                  <div className="text-left">
                    <div className="font-semibold">Phantom</div>
                    <div className="text-sm text-muted-foreground">{t('browserExtension')}</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Language Selector - Hidden on mobile */}
        <LanguageSelectorSidebar>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hidden md:flex"
          >
            <Languages className="h-5 w-5" />
          </Button>
        </LanguageSelectorSidebar>

        {/* Desktop Menu Icon - Hidden on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hidden md:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link 
                href="https://github.com/Stele-finance/interface"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('github')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                href="#"
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                {t('doc')}
              </Link>
            </DropdownMenuItem>
                         <DropdownMenuItem asChild>
               <Link 
                 href="https://x.com/stelefinance"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="cursor-pointer"
               >
                 <Twitter className="mr-2 h-4 w-4" />
                 X
               </Link>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[60vh]">
            <div className="p-4 pb-6">
              {/* Handle Bar */}
              <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto mb-4"></div>
              
              {/* Menu Items */}
              <div className="space-y-1 mb-6">
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname === "/" || pathname === "/dashboard"
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  {t('dashboard')}
                </Link>
                
                <Link 
                  href="/challenges"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname.includes("/challenges") || pathname.includes("/challenge/")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  {t('challenges')}
                </Link>
                
                <Link 
                  href="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname.includes("/portfolio")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <User className="h-5 w-5 mr-3" />
                  {t('myPortfolios')}
                </Link>
                
                <Link 
                  href="/vote"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname.includes("/vote")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Vote className="h-5 w-5 mr-3" />
                  {t('vote')}
                </Link>
              </div>
               
                             {/* Separator */}
              <div className="border-t border-border mb-4"></div>
               
               {/* Links */}
              <div className="space-y-1">
                <Link 
                  href="https://github.com/Stele-finance/interface"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Github className="h-4 w-4 mr-3" />
                  {t('github')}
                </Link>
                
                <Link 
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  {t('doc')}
                </Link>
                
                                 <Link 
                   href="https://x.com/stelefinance"
                   target="_blank"
                   rel="noopener noreferrer"
                   onClick={() => setMobileMenuOpen(false)}
                   className="flex items-center px-4 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                 >
                   <Twitter className="h-4 w-4 mr-3" />
                   X
                 </Link>
                 
                 {/* Language Selector */}
                 <LanguageSelectorSidebar>
                   <div className="flex items-center px-4 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                     <Languages className="h-4 w-4 mr-3" />
                     {t('language')}
                   </div>
                 </LanguageSelectorSidebar>
               </div>
             </div>
           </div>
        </>
      )}
    </header>
  )
}
