"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, ArrowDownCircle, ArrowUpCircle, DollarSign, Loader2 } from "lucide-react"
import { AssetSwap } from "@/app/swap/components/AssetSwap"
import { useWallet } from "@/app/hooks/useWallet"
import { useFundInvestableTokens } from "../../hooks/useFundInvestableTokens"
import { useFundUserTokens } from "../../hooks/useFundUserTokens"
import { useETHPrice } from "@/app/hooks/useETHPrice"
import { ethers } from "ethers"
import { ETHEREUM_CHAIN_CONFIG, ARBITRUM_CHAIN_CONFIG, NETWORK_CONTRACTS, getSteleFundContractAddress } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import SteleFundABI from "@/app/abis/SteleFund.json"
import Image from "next/image"

interface FundActionTabsProps {
  isManager: boolean
  isInvestor: boolean
  connectedAddress: string | null
  fundId: string
  network: string
}

export function FundActionTabs({ 
  isManager, 
  isInvestor, 
  connectedAddress,
  fundId,
  network
}: FundActionTabsProps) {
  const { address, getProvider, walletType } = useWallet()
  const [activeTab, setActiveTab] = useState("swap")
  const [isAssetSwapping, setIsAssetSwapping] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [ethBalance, setEthBalance] = useState("0")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // Get investable tokens and user tokens from Fund subgraph
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'arbitrum'
  const { data: investableTokens = [], isLoading: isLoadingInvestableTokens } = useFundInvestableTokens(subgraphNetwork as 'ethereum' | 'arbitrum')
  const { data: fundUserTokens = [], isLoading: isLoadingUserTokens } = useFundUserTokens(fundId, subgraphNetwork as 'ethereum' | 'arbitrum')
  
  // Get ETH price for USD value display
  const { ethPrice } = useETHPrice(subgraphNetwork as 'ethereum' | 'arbitrum')
  
  // Calculate USD value of deposit amount
  const calculateUSDValue = (ethAmount: string): string => {
    if (!ethAmount || !ethPrice || parseFloat(ethAmount) <= 0) return '$0.00'
    const usdValue = parseFloat(ethAmount) * ethPrice
    return `$${usdValue.toFixed(2)}`
  }
  
  // Determine which tabs to show based on user role
  const showTabs = isManager || isInvestor
  const isManagerAndInvestor = isManager && isInvestor
  const isOnlyInvestor = !isManager && isInvestor
  
  // Define available tabs based on role
  const availableTabs = isManagerAndInvestor 
    ? ["swap", "deposit", "withdraw", "fee"]
    : isOnlyInvestor 
    ? ["deposit", "withdraw"]
    : []
  
  // Fetch ETH balance for the specific network (from URL, not wallet network)
  useEffect(() => {
    const fetchEthBalance = async () => {
      if (!address) return
      
      try {
        // Get RPC URL based on network parameter from URL
        const rpcUrl = network === 'ethereum' 
          ? ETHEREUM_CHAIN_CONFIG.rpcUrls[0]
          : ARBITRUM_CHAIN_CONFIG.rpcUrls[0]
        
        // Create provider for the specific network
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const balance = await provider.getBalance(address)
        const balanceInEth = ethers.formatEther(balance)
        setEthBalance(balanceInEth)
      } catch (error) {
        console.error(`Error fetching ETH balance for ${network}:`, error)
        setEthBalance("0")
      }
    }

    fetchEthBalance()
  }, [address, network])
  
  // Set initial active tab to first available tab
  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [availableTabs.length, activeTab])
  
  // Handle percentage clicks for deposit using actual ETH balance
  const handleDepositPercentage = (percentage: number) => {
    const balance = parseFloat(ethBalance)
    const amount = (balance * percentage / 100).toFixed(4)
    setDepositAmount(amount)
  }
  
  // Handle percentage clicks for withdraw
  const handleWithdrawPercentage = (percentage: number) => {
    setWithdrawAmount(percentage.toString())
  }
  
  // Handle withdraw from SteleFund contract
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Percentage",
        description: "Please select a withdrawal percentage.",
      })
      return
    }
    
    setIsWithdrawing(true)
    
    try {
      // WalletConnect only
      const provider = getProvider()
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.")
      }
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', [])
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet first.")
      }
      
      // Get wallet's current network
      const walletChainId = await provider.send('eth_chainId', [])
      const expectedChainId = network === 'arbitrum' ? '0xa4b1' : '0x1'
      
      // If wallet is on wrong network, switch to URL-based network
      if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        try {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: expectedChainId }
          ])
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            const networkParams = network === 'arbitrum' ? {
              chainId: expectedChainId,
              chainName: 'Arbitrum One',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://arbiscan.io']
            } : {
              chainId: expectedChainId,
              chainName: 'Ethereum Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
              blockExplorerUrls: ['https://etherscan.io']
            }
            
            await provider.send('wallet_addEthereumChain', [networkParams])
          } else if (switchError.code === 4001) {
            const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum'
            throw new Error(`Please switch to ${networkName} network to withdraw.`)
          } else {
            throw switchError
          }
        }
      }
      
      // Get signer
      const signer = await provider.getSigner()
      
      // Get SteleFund contract address based on network
      const contractKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
      const contractAddress = NETWORK_CONTRACTS[contractKey]?.STELE_FUND_CONTRACT_ADDRESS
      
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`SteleFund contract not configured for ${network} network`)
      }
      
      // Create contract instance
      const steleFundContract = new ethers.Contract(
        contractAddress,
        SteleFundABI.abi,
        signer
      )
      
      // Convert percentage to basis points (100% = 10000)
      const percentageInBasisPoints = Math.round(parseFloat(withdrawAmount) * 100)
      
      console.log("Withdrawing:", {
        fundId,
        percentage: withdrawAmount + "%",
        basisPoints: percentageInBasisPoints
      })
      
      // Call withdraw function
      const tx = await steleFundContract.withdraw(
        fundId,
        percentageInBasisPoints,
        {
          gasLimit: 1000000 // Set explicit gas limit
        }
      )
      
      // Get explorer info
      const explorerName = getExplorerName(walletChainId)
      const explorerUrl = getExplorerUrl(walletChainId, tx.hash)
      
      toast({
        title: "Withdrawal Submitted",
        description: `Withdrawing ${withdrawAmount}% from fund ${fundId}`,
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      })
      
      // Wait for transaction to be mined
      await tx.wait()
      
      // Show success toast
      toast({
        title: "Withdrawal Successful!",
        description: `Successfully withdrew ${withdrawAmount}% from fund ${fundId}`,
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      })
      
      // Clear the input
      setWithdrawAmount("0")
      
    } catch (error: any) {
      console.error("Error withdrawing from fund:", error)
      
      let errorMessage = "An error occurred while withdrawing. Please try again."
      
      if (error.code === 4001 || error.message?.includes('rejected')) {
        errorMessage = "Transaction was cancelled by user"
      } else if (error.message?.includes("US")) {
        errorMessage = "You are not an investor in this fund"
      } else if (error.message?.includes("IP")) {
        errorMessage = "Invalid percentage. Must be between 0.01% and 100%"
      } else if (error.message?.includes("NS")) {
        errorMessage = "You have no shares in this fund"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: errorMessage,
      })
      
    } finally {
      setIsWithdrawing(false)
    }
  }
  
  // Get explorer URL helper function
  const getExplorerUrl = (chainId: string, txHash: string) => {
    if (chainId === '0xa4b1' || chainId === '42161') {
      return `https://arbiscan.io/tx/${txHash}`
    } else {
      return `https://etherscan.io/tx/${txHash}`
    }
  }
  
  // Get explorer name helper function
  const getExplorerName = (chainId: string) => {
    if (chainId === '0xa4b1' || chainId === '42161') {
      return 'Arbiscan'
    } else {
      return 'Etherscan'
    }
  }
  
  // Handle deposit ETH to SteleFund contract
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount.",
      })
      return
    }
    
    setIsDepositing(true)
    
    try {
      // WalletConnect only
      const provider = getProvider()
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.")
      }
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', [])
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet first.")
      }
      
      // Get wallet's current network
      const walletChainId = await provider.send('eth_chainId', [])
      const expectedChainId = network === 'arbitrum' ? '0xa4b1' : '0x1'
      
      // If wallet is on wrong network, switch to URL-based network
      if (walletChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        try {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: expectedChainId }
          ])
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            const networkParams = network === 'arbitrum' ? {
              chainId: expectedChainId,
              chainName: 'Arbitrum One',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://arbiscan.io']
            } : {
              chainId: expectedChainId,
              chainName: 'Ethereum Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
              blockExplorerUrls: ['https://etherscan.io']
            }
            
            await provider.send('wallet_addEthereumChain', [networkParams])
          } else if (switchError.code === 4001) {
            const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum'
            throw new Error(`Please switch to ${networkName} network to deposit.`)
          } else {
            throw switchError
          }
        }
      }
      
      // Get signer
      const signer = await provider.getSigner()
      
      // Get SteleFund contract address based on network
      const contractKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
      const contractAddress = NETWORK_CONTRACTS[contractKey]?.STELE_FUND_CONTRACT_ADDRESS
      
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`SteleFund contract not configured for ${network} network`)
      }
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(depositAmount)
      
      // Encode fundId as bytes data for fallback function
      const fundIdBytes = ethers.toBeHex(BigInt(fundId), 32) // Convert to 32-byte hex
      
      // Send ETH directly to contract with fundId as data (using fallback function)
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: amountInWei,
        data: fundIdBytes
      })
      
      // Show toast notification for transaction submitted
      const explorerName = getExplorerName(walletChainId)
      const explorerUrl = getExplorerUrl(walletChainId, tx.hash)
      
      toast({
        title: "Deposit Submitted",
        description: `Depositing ${depositAmount} ETH to fund ${fundId}`,
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      })
      
      // Wait for transaction to be mined
      await tx.wait()
      
      // Show success toast
      toast({
        title: "Deposit Successful!",
        description: `Successfully deposited ${depositAmount} ETH to fund ${fundId}`,
        action: (
          <ToastAction altText={`View on ${explorerName}`} onClick={() => window.open(explorerUrl, '_blank')}>
            View on {explorerName}
          </ToastAction>
        ),
      })
      
      // Clear the input
      setDepositAmount("")
      
    } catch (error: any) {
      console.error("Error depositing ETH:", error)
      
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error.message || "An unknown error occurred",
      })
      
    } finally {
      setIsDepositing(false)
    }
  }
  
  // If user is neither manager nor investor, don't show tabs
  if (!showTabs || !connectedAddress) {
    return null
  }
    
  if (availableTabs.length === 0) {
    return null
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${isManagerAndInvestor ? 'grid-cols-4' : 'grid-cols-2'} bg-transparent border-0 p-0`}>
          {isManagerAndInvestor && (
            <TabsTrigger 
              value="swap" 
              className="flex items-center gap-2 rounded-full data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
            >
              <ArrowUpDown className="h-4 w-4" />
              Swap
            </TabsTrigger>
          )}
          
          <TabsTrigger 
            value="deposit" 
            className="flex items-center gap-2 rounded-full data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
          >
            Deposit
          </TabsTrigger>
          
          <TabsTrigger 
            value="withdraw" 
            className="flex items-center gap-2 rounded-full data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Withdraw
          </TabsTrigger>
          
          {isManagerAndInvestor && (
            <TabsTrigger 
              value="fee" 
              className="flex items-center gap-2 rounded-full data-[state=active]:bg-orange-500/40 data-[state=active]:text-white text-gray-400"
            >
              Fee
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Swap Tab Content - Only for managers who are investors */}
        {isManagerAndInvestor && (
          <TabsContent value="swap" className="space-y-4">
            {isLoadingUserTokens || isLoadingInvestableTokens ? (
              <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-400">Loading swap data...</p>
                </div>
              </div>
            ) : investableTokens.length > 0 ? (
              <AssetSwap 
                userTokens={fundUserTokens.map(token => ({
                  symbol: token.symbol,
                  balance: token.amount || '0',
                  amount: token.amount || '0',
                  address: token.address,
                  decimals: token.decimals?.toString() || '18'
                }))} 
                investableTokens={investableTokens}
                onSwappingStateChange={setIsAssetSwapping}
              />
            ) : (
              <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <ArrowUpDown className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No Investable Tokens</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      There are no tokens available for investment at this time.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Please wait for investable tokens to be configured by the protocol.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        )}
        
        {/* Deposit Tab Content */}
        <TabsContent value="deposit" className="space-y-4">
          <div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="flex items-center gap-1">
                      <Image 
                        src="/tokens/eth.png" 
                        alt="ETH" 
                        width={16} 
                        height={16} 
                        className="h-4 w-4"
                      />
                      ETH
                    </span>
                  </label>
                  <span className="text-sm text-gray-400">
                    Balance: {parseFloat(ethBalance).toFixed(4)}
                  </span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDepositPercentage(25)}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                      >
                        25%
                      </button>
                      <button 
                        onClick={() => handleDepositPercentage(50)}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                      >
                        50%
                      </button>
                      <button 
                        onClick={() => handleDepositPercentage(75)}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                      >
                        75%
                      </button>
                      <button 
                        onClick={() => handleDepositPercentage(100)}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    {depositAmount && parseFloat(depositAmount) > 0 && (
                      <div className="text-right">
                        <span className="text-sm text-gray-400">
                          {calculateUSDValue(depositAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full px-6 py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white rounded-2xl transition-colors disabled:cursor-not-allowed"
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" />
                    Depositing...
                  </>
                ) : (
                  'Deposit'
                )}
              </button>
            </div>
          </div>
        </TabsContent>
        
        {/* Withdraw Tab Content */}
        <TabsContent value="withdraw" className="space-y-4">
          <div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-300">
                    Withdraw Percentage
                  </label>
                  <span className="text-lg font-semibold text-orange-400">
                    {withdrawAmount}%
                  </span>
                </div>
                
                {/* Percentage Slider */}
                <div className="relative mb-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f97316 0%, #f97316 ${withdrawAmount}%, #374151 ${withdrawAmount}%, #374151 100%)`
                    }}
                  />
                  <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      height: 20px;
                      width: 20px;
                      border-radius: 50%;
                      background: #f97316;
                      cursor: pointer;
                      border: 2px solid #fff;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    input[type="range"]::-moz-range-thumb {
                      height: 20px;
                      width: 20px;
                      border-radius: 50%;
                      background: #f97316;
                      cursor: pointer;
                      border: 2px solid #fff;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                  `}</style>
                </div>

                {/* Quick percentage buttons */}
                <div className="flex gap-2 mt-2 mb-2">
                  <button 
                    onClick={() => handleWithdrawPercentage(25)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      withdrawAmount === '25' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    25%
                  </button>
                  <button 
                    onClick={() => handleWithdrawPercentage(50)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      withdrawAmount === '50' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    50%
                  </button>
                  <button 
                    onClick={() => handleWithdrawPercentage(75)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      withdrawAmount === '75' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    75%
                  </button>
                  <button 
                    onClick={() => handleWithdrawPercentage(100)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      withdrawAmount === '100' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full px-6 py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white rounded-2xl transition-colors disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" />
                      Withdrawing...
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Fee Tab Content - Only for managers who are investors */}
        {isManagerAndInvestor && (
          <TabsContent value="fee" className="space-y-4">
            <div>
              <p className="text-gray-400 mb-4">
                Collect management fees
              </p>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-sm text-gray-400">Accumulated Fees</span>
                  <span className="text-sm text-white font-medium">$0.00</span>
                </div>
                <button className="w-full px-6 py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition-colors">
                  Collect Fees
                </button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
  )
}