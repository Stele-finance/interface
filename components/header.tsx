"use client"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Trophy, BarChart3, Vote } from "lucide-react"
import { cn, getNetworkLogo, getWalletLogo } from "@/lib/utils"
import { User, Wallet, Menu, Github, FileText, Twitter, Languages } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  getRPCUrl
} from "@/lib/constants"
import { useEntryFee } from "@/lib/hooks/use-entry-fee"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelectorSidebar } from "./language-selector-sidebar"
import { useToast } from "@/components/ui/use-toast"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import Image from "next/image"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  
  // Use global wallet hook
  const { 
    address: walletAddress, 
    isConnected, 
    network: walletNetwork, 
    walletType,
    isLoading: isWalletLoading,
    connectWallet, 
    disconnectWallet, 
    switchNetwork, 
    openWalletModal,
    isMobile: isWalletMobile
  } = useWallet()
  

  





  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [challengesDropdownOpen, setChallengesDropdownOpen] = useState(false)
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  
  // Track previous network and wallet address for detecting changes
  const prevNetworkRef = useRef<string | null>(null)
  const prevWalletAddressRef = useRef<string | null>(null)
  
  // Get entry fee from context
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee()

  // Get wallet icon - WalletConnect only
  const getWalletIcon = () => {
    if (walletType === 'walletconnect') {
      return getWalletLogo('walletconnect')
    }
    return null
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
      
        // Use network-specific RPC URL for accurate balance
      const networkToUse = walletNetwork || 'ethereum';
        const rpcUrl = getRPCUrl(networkToUse);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Get ETH balance using ethers provider
        const balanceWei = await provider.getBalance(walletAddress);
        const balanceInEth = parseFloat(ethers.formatEther(balanceWei));
        
        // Display up to 4 decimal places
        setBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance('?');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConnectWallet = async () => {
    setWalletSelectOpen(false)
    
    try {
      await connectWallet() // No parameters needed - WalletConnect only
      
      // Success toast
      toast({
        variant: "default",
        title: "✅ Connection Successful",
        description: "Successfully connected to WalletConnect",
        duration: 3000,
      })
    } catch (error) {
      console.error("Wallet connection error:", error)
      
      // Show error toast
      toast({
        variant: "destructive",
        title: "🚫 Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        duration: 5000,
      })
    }
  }

  const handleDisconnectWallet = () => {
    setBalance('0')
    disconnectWallet()
  }

  // Switch between Networks
  const switchWalletNetwork = async (targetNetwork: 'ethereum' | 'arbitrum') => {
    try {
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
        } else {
          description = error.message
        }
      }
      
      toast({
        variant: "destructive",
        title,
        description,
      })
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
    <header className="sticky top-0 z-30 border-b border-border h-20 flex items-center justify-between px-4 md:px-6 bg-muted/40">
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
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            <DropdownMenuContent align="start" className="w-36 bg-muted/80 border-gray-600">
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
            {walletType === 'walletconnect' ? (
              <Button 
                variant="outline" 
                size="lg" 
                className="text-primary border-gray-600 bg-muted/40 hover:bg-muted/60 font-medium px-4 sm:px-6 py-3 h-auto text-base sm:text-lg"
                onClick={() => openWalletModal && openWalletModal()}
              >
                <Image 
                  src={getWalletLogo('walletconnect')} 
                  alt="WalletConnect"
                  width={16}
                  height={16}
                  className="mr-2"
                  style={{ width: 'auto', height: '16px' }}
                />
                <span className="text-base">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="text-primary border-gray-600 bg-muted/40 hover:bg-muted/60 font-medium px-4 sm:px-6 py-3 h-auto text-base sm:text-lg">
                    {walletIcon ? (
                      <Image 
                        src={walletIcon} 
                        alt={`${walletType} wallet`}
                        width={16}
                        height={16}
                        className="mr-2"
                        style={{ width: 'auto', height: '16px' }}
                      />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    <span className="text-base">
                      {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-muted border-gray-600">
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
                  <DropdownMenuItem onClick={() => switchWalletNetwork('arbitrum')}>
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
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnectWallet}>
                  {t('disconnect')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </div>
        ) : (
          <Dialog open={walletSelectOpen} onOpenChange={setWalletSelectOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 text-white font-medium px-4 sm:px-6 py-3 h-auto text-base sm:text-lg"
                onClick={() => setWalletSelectOpen(true)}
              >
                <Wallet className="mr-2 h-5 w-5" />
                <span className="text-base">
                  {t('connectWallet')}
                </span>
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
                {/* PC & Mobile: Show WalletConnect only */}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 flex items-center justify-start gap-4 p-4 bg-muted/40 border-gray-600 hover:bg-muted/60"
                  onClick={() => handleConnectWallet()}
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
                      {isWalletMobile ? 'Connect Mobile Wallet' : 'Mobile & Desktop Wallets'}
                    </div>
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
          <DropdownMenuContent align="end" className="w-16 bg-muted/80 border-gray-600">
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
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-muted border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[60vh]">
            <div className="p-4 pb-4">
              {/* Handle Bar */}
              <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto mb-4"></div>
              
              {/* Menu Items */}
              <div className="space-y-1 mb-4">
                <Link 
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
              <div className="border-t border-gray-600 my-4 mx-2"></div>
               
               {/* Icon Links - displayed horizontally */}
              <div className="flex items-center justify-center gap-8 px-4 py-0">
                <Link 
                  href="https://github.com/Stele-finance/interface"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Github className="h-5 w-5" />
                </Link>
                
                <Link 
                  href="#"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <FileText className="h-5 w-5" />
                </Link>
                
                <Link 
                  href="https://x.com/stelefinance"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
                 
                {/* Language Selector */}
                <LanguageSelectorSidebar>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                    <Languages className="h-5 w-5" />
                  </div>
                </LanguageSelectorSidebar>
               </div>
               
               {/* Reduced empty space */}
               <div className="h-2"></div>
             </div>
           </div>
        </>
      )}
    </header>
  )
}
