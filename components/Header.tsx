"use client"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Trophy, BarChart3, Vote, Image as ImageIcon } from "lucide-react"
import { cn, getNetworkLogo, getWalletLogo, detectActualWalletType } from "@/lib/utils"
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
import { createPortal } from "react-dom"
import { ethers } from "ethers"
import {
  getRPCUrl
} from "@/lib/constants"
import { useWallet } from "@/app/hooks/useWallet"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelectorSidebar } from "@/components/LanguageSelectorSidebar"
import { useToast } from "@/components/ui/use-toast"
import { useMobileMenu } from "@/lib/mobile-menu-context"
import Image from "next/image"
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react'
import { useIsMobile } from "@/components/ui/use-mobile"
import { usePageType } from "@/lib/page-type-context"
import { ChevronDown, PieChart } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const isMobile = useIsMobile()
  const { pageType: contextPageType, setPageType } = usePageType()
  
  // Determine pageType from URL
  const getPageTypeFromUrl = () => {
    if (pathname.includes('/fund')) return 'fund'
    if (pathname.includes('/funds')) return 'fund'
    if (pathname.includes('/challenge')) return 'challenge'
    if (pathname.includes('/challenges')) return 'challenge'
    // Default to challenge
    return 'challenge'
  }
  
  const pageType = getPageTypeFromUrl()
  
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
  
  // Use AppKit provider and account to get actual wallet info
  const { walletProvider } = useAppKitProvider('eip155')
  const appKitAccount = useAppKitAccount()

  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [walletSelectOpen, setWalletSelectOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Track previous network and wallet address for detecting changes
  const prevNetworkRef = useRef<string | null>(null)
  const prevWalletAddressRef = useRef<string | null>(null)
  
  // Get wallet icon - detect actual wallet type from provider
  const getWalletIcon = () => {    
    if (walletType === 'walletconnect' && walletProvider) {
      const actualWalletType = detectActualWalletType(walletProvider)
      return getWalletLogo(actualWalletType)
    }
    return null
  }

  // Set mounted state for Portal
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Force re-render when wallet provider changes
  useEffect(() => {}, [walletProvider, isConnected, walletType])

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
        return { symbol: 'ETH', name: 'Mainnet' };
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

    // Update the previous network reference but don't navigate
    // This prevents unwanted redirects when network changes
    prevNetworkRef.current = walletNetwork;
  }, [walletNetwork, pathname, router]);

  // Navigate to dashboard when wallet address changes
  useEffect(() => {
    // Skip on initial load (when prevWalletAddressRef is null)
    if (prevWalletAddressRef.current === null) {
      prevWalletAddressRef.current = walletAddress;
      return;
    }

    // Only navigate if wallet address actually changed and not already on dashboard/challenges
    // Also skip if wallet is being disconnected (walletAddress becomes null)
    if (prevWalletAddressRef.current !== walletAddress && 
        walletAddress !== null && 
        !pathname.includes('/dashboard') && 
        !pathname.includes('/challenges')) {
      prevWalletAddressRef.current = walletAddress;
      
      // Determine which dashboard to navigate to based on current path
      if (pathname.includes('/fund')) {
        router.push('/dashboard/fund');
      } else {
        // Default to challenge dashboard for all other pages (including /challenge)
        router.push('/dashboard/challenge');
      }
    } else {
      prevWalletAddressRef.current = walletAddress;
    }
  }, [walletAddress, pathname, router]);

  const { symbol, name } = getNetworkInfo();
  const walletIcon = getWalletIcon();

  // Hide header on home page
  if (pathname === '/home') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border h-20 flex items-center justify-between px-4 md:px-6 bg-muted/40">
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
          <span className="hidden sm:block text-orange-500 text-xl sm:text-2xl">Stele</span>
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
            href={pageType === 'fund' ? '/dashboard/fund' : '/dashboard/challenge'}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-lg font-medium transition-colors",
              pathname === "/" || pathname.includes("/dashboard")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            {t('dashboard')}
          </Link>
          
          <Link 
            href={pageType === 'fund' ? '/funds' : '/challenges'}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-lg font-medium transition-colors",
              pathname.includes("/challenges") || pathname.includes("/challenge/") || pathname.includes("/funds") || pathname.includes("/fund/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pageType === 'fund' ? (
              <PieChart className="h-5 w-5" />
            ) : (
              <Trophy className="h-5 w-5" />
            )}
            {pageType === 'fund' ? t('funds') : t('challenges')}
          </Link>
          
          <Link 
            href={pageType === 'fund' ? '/nft/fund' : '/nft/challenge'}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-lg font-medium transition-colors",
              pathname.includes("/nft")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageIcon className="h-5 w-5" />
            NFTs
          </Link>
          
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Challenge/Fund Type Selector - always visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 font-medium px-3 py-2 h-auto text-sm capitalize border-0 transition-colors"
            >
              <div className="flex items-center gap-2">
                {pageType === 'challenge' ? (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                ) : (
                  <PieChart className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-gray-100">{pageType}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 bg-gray-900/95 border-gray-700/50 backdrop-blur-sm z-[60] shadow-xl">
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-gray-800/80 focus:bg-gray-800/80 text-gray-200"
              onClick={() => {
                router.push('/dashboard/challenge')
              }}
            >
              <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Challenge</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-gray-800/80 focus:bg-gray-800/80 text-gray-200"
              onClick={() => {
                router.push('/dashboard/fund')
              }}
            >
              <PieChart className="mr-2 h-4 w-4 text-blue-500" />
              <span>Fund</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {walletAddress ? (
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile ? (
              // Mobile: Open AppKit modal directly on click - icon only
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary border-gray-600 bg-muted/40 hover:bg-muted/60 font-medium p-2 h-auto"
                onClick={() => openWalletModal()}
              >
                {getWalletIcon() ? (
                  <Image 
                    src={getWalletIcon()!} 
                    alt="Connected Wallet"
                    width={20}
                    height={20}
                    style={{ width: 'auto', height: '20px' }}
                  />
                ) : (
                  <Image 
                    src={getWalletLogo('walletconnect')} 
                    alt="WalletConnect"
                    width={20}
                    height={20}
                    style={{ width: 'auto', height: '20px' }}
                  />
                )}
              </Button>
            ) : (
              // PC: Open AppKit modal directly on click - same as mobile
              <Button 
                variant="outline" 
                size="lg" 
                className="text-primary border-gray-600 bg-muted/40 hover:bg-muted/60 font-medium px-4 sm:px-6 py-3 h-auto text-base sm:text-lg"
                onClick={() => openWalletModal()}
              >
                {getWalletIcon() ? (
                  <Image 
                    src={getWalletIcon()!} 
                    alt="Connected Wallet"
                    width={16}
                    height={16}
                    className="mr-2"
                    style={{ width: 'auto', height: '16px' }}
                  />
                ) : (
                  <Image 
                    src={getWalletLogo('walletconnect')} 
                    alt="WalletConnect"
                    width={16}
                    height={16}
                    className="mr-2"
                    style={{ width: 'auto', height: '16px' }}
                  />
                )}
                <span className="text-base">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
              </Button>
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
          <DropdownMenuContent align="end" className="w-16 bg-muted/80 border-gray-600 z-[60]">
            <DropdownMenuItem asChild>
              <Link 
                href="/vote"
                className="cursor-pointer"
              >
                <Vote className="mr-2 h-4 w-4" />
                {t('vote')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
                href="/doc"
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
      {isMobileMenuOpen && isMounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-muted border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[60vh]">
            <div className="p-4 pb-4">
              {/* Handle Bar */}
              <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto mb-4"></div>
              
              {/* Menu Items */}
              <div className="space-y-1 mb-4">
                <Link 
                  href={pageType === 'fund' ? '/dashboard/fund' : '/dashboard/challenge'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname === "/" || pathname.includes("/dashboard")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  {t('dashboard')}
                </Link>
                
                <Link 
                  href={pageType === 'fund' ? '/funds' : '/challenges'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname.includes("/challenges") || pathname.includes("/challenge/") || pathname.includes("/funds") || pathname.includes("/fund/")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {pageType === 'fund' ? (
                    <PieChart className="h-5 w-5 mr-3" />
                  ) : (
                    <Trophy className="h-5 w-5 mr-3" />
                  )}
                  {pageType === 'fund' ? t('funds') : t('challenges')}
                </Link>
                
                <Link 
                  href={pageType === 'fund' ? '/nft/fund' : '/nft/challenge'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-colors",
                    pathname.includes("/nft")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <ImageIcon className="h-5 w-5 mr-3" />
                  NFTs
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
                  href="/doc"
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
        </>,
        document.body
      )}
    </header>
  )
}
