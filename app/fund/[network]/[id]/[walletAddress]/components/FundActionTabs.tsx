"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, ArrowDownCircle, DollarSign, Loader2, PieChart } from "lucide-react"
import { FundAssetSwap } from "@/app/swap/components/FundAssetSwap"
import { useWallet } from "@/app/hooks/useWallet"
import { useFundInvestableTokens } from "../../hooks/useFundInvestableTokens"
import { useFundUserTokens } from "../../hooks/useFundUserTokens"
import { useFundData } from "../../hooks/useFundData"
import { useETHPrice } from "@/app/hooks/useETHPrice"
import { useTokenPrices } from "@/lib/token-price-context"
import { ethers } from "ethers"
import { ETHEREUM_CHAIN_CONFIG, ARBITRUM_CHAIN_CONFIG, NETWORK_CONTRACTS, getSteleFundContractAddress } from "@/lib/constants"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import SteleFundABI from "@/app/abis/SteleFund.json"
import Image from "next/image"
import { useQueryClient } from "@tanstack/react-query"

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("swap")
  const [isAssetSwapping, setIsAssetSwapping] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [ethBalance, setEthBalance] = useState("0")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isCollectingFees, setIsCollectingFees] = useState(false)
  
  // Get investable tokens and user tokens from Fund subgraph
  const subgraphNetwork = network === 'ethereum' || network === 'arbitrum' ? network : 'arbitrum'
  const { data: investableTokens = [], isLoading: isLoadingInvestableTokens } = useFundInvestableTokens(subgraphNetwork as 'ethereum' | 'arbitrum')
  const { data: fundUserTokens = [], isLoading: isLoadingUserTokens } = useFundUserTokens(fundId, subgraphNetwork as 'ethereum' | 'arbitrum')
  const { data: fundDataResponse, isLoading: isLoadingFundData } = useFundData(fundId, subgraphNetwork as 'ethereum' | 'arbitrum')
  
  // Get ETH price for USD value display
  const { ethPrice } = useETHPrice(subgraphNetwork as 'ethereum' | 'arbitrum')
  
  
  // Get prices for fee tokens from the global context
  const { getTokenPrice, getTokenPriceBySymbol, isLoading: isLoadingFeeTokenPrices } = useTokenPrices()
  
  // Calculate USD value of deposit amount
  const calculateUSDValue = (ethAmount: string): string => {
    if (!ethAmount || !ethPrice || parseFloat(ethAmount) <= 0) return '$0.00'
    const usdValue = parseFloat(ethAmount) * ethPrice
    return `$${usdValue.toFixed(2)}`
  }
  
  // Calculate fee portfolio data for pie chart
  const feePortfolioData = useMemo(() => {
    const fund = fundDataResponse?.fund
    if (!fund || !fund.feeTokensAmount || fund.feeTokensAmount.length === 0 || isLoadingFeeTokenPrices) {
      return {
        tokens: [],
        totalValue: 0,
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
      }
    }
    
    const tokens = fund.feeTokensAmount.map((amount: string, index: number) => {
      const amountValue = parseFloat(amount || '0')
      const tokenSymbol = fund.feeSymbols?.[index] || 'UNKNOWN'
      const tokenAddress = fund.feeTokens?.[index]
      
      // Get token price from context
      let tokenPrice = 0
      const priceData = getTokenPrice(tokenAddress) || getTokenPriceBySymbol(tokenSymbol)
      if (priceData) {
        tokenPrice = priceData.priceUSD
      }
      
      const value = amountValue * tokenPrice
      
      return {
        symbol: tokenSymbol,
        amount: amountValue,
        value,
        price: tokenPrice,
        percentage: 0 // Will be calculated after total
      }
    }).filter(token => token.amount > 0 && token.value > 0)
    
    // Calculate total value
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0)
    
    // Calculate percentages
    if (tokens.length === 1) {
      tokens[0].percentage = 100
    } else if (totalValue > 0) {
      let totalPercentage = 0
      tokens.forEach((token, index) => {
        if (index === tokens.length - 1) {
          token.percentage = 100 - totalPercentage
        } else {
          token.percentage = (token.value / totalValue) * 100
          totalPercentage += token.percentage
        }
      })
    }
    
    // Sort by value descending
    tokens.sort((a, b) => b.value - a.value)
    
    return {
      tokens,
      totalValue,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
    }
  }, [fundDataResponse, getTokenPrice, getTokenPriceBySymbol, isLoadingFeeTokenPrices])
  
  // Calculate accumulated fees in USD
  const calculateAccumulatedFees = (): string => {
    const fund = fundDataResponse?.fund
    if (!fund || !fund.feeTokensAmount || fund.feeTokensAmount.length === 0) {
      return '$0.000'
    }
    
    // If prices are not loaded yet, show loading
    if (isLoadingFeeTokenPrices) {
      return 'Loading...'
    }
    
    // Calculate total USD value using real token prices
    let totalFeesUSD = 0
    
    fund.feeTokensAmount.forEach((amount: string, index: number) => {
      const amountValue = parseFloat(amount || '0')
      if (amountValue > 0) {
        const tokenSymbol = fund.feeSymbols?.[index]
        const tokenAddress = fund.feeTokens?.[index]
        
        // Get token price from context
        let tokenPrice = 0
        const priceData = getTokenPrice(tokenAddress) || getTokenPriceBySymbol(tokenSymbol)
        if (priceData) {
          tokenPrice = priceData.priceUSD
        }
        
        // Calculate USD value (amount is already in token units with decimals)
        totalFeesUSD += amountValue * tokenPrice
      }
    })
    
    return `$${totalFeesUSD.toFixed(3)}`
  }
  
  // Determine which tabs to show based on user role
  const showTabs = isManager || isInvestor
  const isManagerAndInvestor = isManager && isInvestor
  const isOnlyInvestor = !isManager && isInvestor
  
  // Define available tabs based on role
  const availableTabs = useMemo(() => {
    return isManagerAndInvestor 
      ? ["swap", "deposit", "withdraw", "fee"]
      : isOnlyInvestor 
      ? ["deposit", "withdraw"]
      : []
  }, [isManagerAndInvestor, isOnlyInvestor])
  
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
  }, [availableTabs, activeTab])
  
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
      // Get provider - same approach as Fund Create
      const provider = await getProvider()
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.")
      }

      // Always switch to the selected network before making the transaction
      const targetChainId = network === 'arbitrum' ? 42161 : 1;

      // Try to switch to the selected network
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added to wallet, add it
          const networkConfig = network === 'arbitrum' ? {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/']
          } : {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
          };

          await provider.send('wallet_addEthereumChain', [networkConfig]);
        } else if (switchError.code === 4001) {
          // User rejected the network switch
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to withdraw.`);
        } else {
          throw switchError;
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner()
      
      // Get SteleFund contract address based on network
      const contractKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
      const contractAddress = NETWORK_CONTRACTS[contractKey]?.STELE_FUND_CONTRACT_ADDRESS

      if (!contractAddress) {
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
            
      // Call withdraw function
      const tx = await steleFundContract.withdraw(
        fundId,
        percentageInBasisPoints,
        {
          gasLimit: 1000000 // Set explicit gas limit
        }
      )

      // Wait for transaction to be mined
      await tx.wait()

      // Clear the input
      setWithdrawAmount("0")

      // Invalidate queries to refresh data after successful withdraw
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['fund', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestor', subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundTransactions', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestorSnapshots'] });
      }, 3000);

    } catch (error: any) {
      console.error("Error withdrawing from fund:", error)
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
  
  // Handle collect fees from SteleFund contract
  const handleCollectFees = async () => {
    setIsCollectingFees(true)

    try {
      // Get provider - same approach as Fund Create
      const provider = await getProvider()
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.")
      }

      // Always switch to the selected network before making the transaction
      const targetChainId = network === 'arbitrum' ? 42161 : 1;

      // Try to switch to the selected network
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added to wallet, add it
          const networkConfig = network === 'arbitrum' ? {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/']
          } : {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
          };

          await provider.send('wallet_addEthereumChain', [networkConfig]);
        } else if (switchError.code === 4001) {
          // User rejected the network switch
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to collect fees.`);
        } else {
          throw switchError;
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner()
      
      // Get SteleFund contract address based on network
      const contractKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
      const contractAddress = NETWORK_CONTRACTS[contractKey]?.STELE_FUND_CONTRACT_ADDRESS

      if (!contractAddress) {
        throw new Error(`SteleFund contract not configured for ${network} network`)
      }

      // Create contract instance
      const steleFundContract = new ethers.Contract(
        contractAddress,
        SteleFundABI.abi,
        signer
      )
      
      // Get fee tokens from fund data
      const fund = fundDataResponse?.fund
      if (!fund || !fund.feeTokens || fund.feeTokens.length === 0) {
        throw new Error('No fee tokens found')
      }
      
      // Filter tokens that have fees to collect
      const tokensWithFees = fund.feeTokens
        .map((tokenAddress: string, index: number) => ({
          address: tokenAddress,
          amount: parseFloat(fund.feeTokensAmount?.[index] || '0'),
          symbol: fund.feeSymbols?.[index] || 'UNKNOWN'
        }))
        .filter(token => token.amount > 0)
      
      if (tokensWithFees.length === 0) {
        throw new Error('No fees available to collect')
      }
      
      
      // Collect fees for each token
      const successfulCollections: string[] = []
      const failedCollections: { symbol: string; error: string }[] = []
      
      for (const token of tokensWithFees) {
        try {
          
          // Try to estimate gas first
          let gasLimit = BigInt(2000000) // Default gas limit
          try {
            const estimatedGas = await steleFundContract.withdrawFee.estimateGas(
              fundId,
              token.address,
              10000 // 100% in basis points
            )
            // Add 20% buffer to estimated gas
            gasLimit = estimatedGas * BigInt(120) / BigInt(100)
          } catch (estimateError: any) {
            console.warn(`Gas estimation failed for ${token.symbol}:`, estimateError)
            
            // Check for specific revert reasons
            if (estimateError.reason === 'NF' || estimateError.message?.includes('NF')) {
              continue // Skip this token
            }
            if (estimateError.reason === 'OM' || estimateError.message?.includes('OM')) {
              throw new Error('Only the fund manager can collect fees')
            }
          }
          
          // Call withdrawFee function with 100% to collect all fees for this token
          const tx = await steleFundContract.withdrawFee(
            fundId,
            token.address,
            10000, // 100% in basis points
            { gasLimit }
          )
          
          // Wait for transaction
          await tx.wait()
          successfulCollections.push(token.symbol)
          
        } catch (error: any) {
          console.error(`Failed to collect fees for ${token.symbol}:`, error)
          failedCollections.push({
            symbol: token.symbol,
            error: error.message || 'Unknown error'
          })
        }
      }
      
      // Report results
      if (successfulCollections.length === 0) {
        throw new Error('Failed to collect fees from any token')
      }

      // Invalidate queries to refresh data after successful fee collection
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['fund', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestor', subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundTransactions', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestorSnapshots'] });
      }, 3000);

    } catch (error: any) {
      console.error("Error collecting fees:", error)
    } finally {
      setIsCollectingFees(false)
    }
  }
  
  // Handle deposit ETH to SteleFund contract
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return
    }
    
    setIsDepositing(true)

    try {
      // Get provider - same approach as Fund Create
      const provider = await getProvider()
      if (!provider) {
        throw new Error("No provider available. Please connect your wallet first.")
      }

      // Always switch to the selected network before making the transaction
      const targetChainId = network === 'arbitrum' ? 42161 : 1;

      // Try to switch to the selected network
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${targetChainId.toString(16)}` }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Network not added to wallet, add it
          const networkConfig = network === 'arbitrum' ? {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/']
          } : {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
          };

          await provider.send('wallet_addEthereumChain', [networkConfig]);
        } else if (switchError.code === 4001) {
          // User rejected the network switch
          const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Ethereum';
          throw new Error(`Please switch to ${networkName} network to deposit.`);
        } else {
          throw switchError;
        }
      }

      // Get a fresh provider after network switch to ensure we're on the correct network
      const updatedProvider = await getProvider();
      if (!updatedProvider) {
        throw new Error('Failed to get provider after network switch');
      }

      const signer = await updatedProvider.getSigner()
      
      // Get SteleFund contract address based on network
      const contractKey = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
      const contractAddress = NETWORK_CONTRACTS[contractKey]?.STELE_FUND_CONTRACT_ADDRESS

      if (!contractAddress) {
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

      // Wait for transaction to be mined
      await tx.wait()

      // Clear the input
      setDepositAmount("")

      // Invalidate queries to refresh data after successful deposit
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['fund', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundUserTokens', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestor', subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundTransactions', fundId, subgraphNetwork] });
        queryClient.invalidateQueries({ queryKey: ['fundInvestorSnapshots'] });
      }, 3000);

    } catch (error: any) {
      console.error("Error depositing ETH:", error)
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
              <FundAssetSwap 
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
            {fundUserTokens.length === 0 ? (
              <div className="bg-muted/30 border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <ArrowDownCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No Portfolio Found</h3>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </TabsContent>
        
        {/* Fee Tab Content - Only for managers who are investors */}
        {isManagerAndInvestor && (
          <TabsContent value="fee" className="space-y-4">
            <div>
              {/* Fee Tokens List */}
              <div className="mb-6">
                {feePortfolioData.tokens.length > 0 ? (
                  <div className="space-y-3">
                    {feePortfolioData.tokens.map((token, index) => (
                      <div key={token.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">{token.symbol}</span>
                          <span className="text-xs text-gray-500">
                            ({token.amount < 0.0001 && token.amount > 0 
                              ? '<0.0001' 
                              : token.amount.toLocaleString(undefined, { 
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: token.amount < 1 ? 6 : 4 
                                })})
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">
                            {token.percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-green-400">
                            ${token.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No fee tokens accumulated yet</p>
                  </div>
                )}
              </div>

              {/* Fee Collection Section */}
              <div className="border-t border-gray-700/30 pt-4">
                <div className="space-y-4">
                  <button 
                    onClick={handleCollectFees}
                    disabled={isCollectingFees || feePortfolioData.tokens.length === 0}
                    className="w-full px-6 py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:hover:bg-orange-500/50 text-white rounded-2xl transition-colors disabled:cursor-not-allowed"
                  >
                    {isCollectingFees ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" />
                        Collecting...
                      </>
                    ) : (
                      'Collect Fees'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
  )
}