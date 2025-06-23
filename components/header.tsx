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

export function Header() {
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  
  // Use global wallet hook
  const { address: walletAddress, isConnected, network: walletNetwork, connectWallet, disconnectWallet, switchNetwork } = useWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [challengesDropdownOpen, setChallengesDropdownOpen] = useState(false)
  
  // Get entry fee from context
  const { entryFee, isLoading: isLoadingEntryFee } = useEntryFee()

  // Get symbol and chain name based on network
  const getNetworkInfo = () => {
    switch (walletNetwork) {
      case 'ethereum':
        return { symbol: 'ETH', name: 'Ethereum Mainnet' };
      case 'base':
        return { symbol: 'ETH', name: 'Base Mainnet' };
      case 'solana':
        return { symbol: 'SOL', name: 'Solana' };
      default:
        return { symbol: '', name: '' };
    }
  };

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!walletAddress || !window.phantom) return;
    
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
        if (window.phantom?.ethereum) {
          const balanceHex = await window.phantom.ethereum.request({
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

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      await connectWallet()
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
  const switchWalletNetwork = async (targetNetwork: 'solana' | 'ethereum' | 'base') => {
    try {
      setIsConnecting(true)
      await switchNetwork(targetNetwork)
    } catch (error) {
      console.error("Wallet switch error:", error)
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
              <span className="text-sm font-medium text-gray-300">{name}</span>
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
                  <Wallet className="mr-2 h-5 w-5" />
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
                {walletNetwork !== 'base' && (
                  <DropdownMenuItem onClick={() => switchWalletNetwork('base')}>
                    {t('baseMainnet')}
                  </DropdownMenuItem>
                )}
                {walletNetwork !== 'solana' && (
                  <DropdownMenuItem onClick={() => switchWalletNetwork('solana')}>
                    {t('solana')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnectWallet}>
                  {t('disconnect')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="lg" 
            className="text-primary border-primary hover:bg-primary/10 hidden sm:flex font-medium px-4 py-2 h-auto"
            onClick={handleConnectWallet}
            disabled={isConnecting}
          >
            <Wallet className="mr-2 h-5 w-5" />
            <span className="text-base">
              {isConnecting ? t('connecting') : t('connectWallet')}
            </span>
        </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="h-7 w-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-base w-48">
            <DropdownMenuLabel className="text-lg font-semibold">{t('language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-base py-2 cursor-pointer" 
              onClick={() => setLanguage('en')}
            >
              <Languages className="h-4 w-4 mr-2" />
              {t('english')}
              {language === 'en' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-base py-2 cursor-pointer" 
              onClick={() => setLanguage('zh')}
            >
              <Languages className="h-4 w-4 mr-2" />
              {t('chinese')}
              {language === 'zh' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
    </header>
  )
}
