'use client'

import { useState, useEffect, useCallback, use, useRef } from "react"
import { getManagedProvider, providerManager } from "@/lib/provider-manager"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Clock, Calendar, User, FileText, Vote as VoteIcon, Loader2, CheckCircle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ethers } from "ethers"
import { 
  STELE_DECIMALS, 
  STELE_TOTAL_SUPPLY,
  getGovernanceContractAddress,
  getSteleTokenAddress,
  getRPCUrl
} from "@/lib/constants"
import GovernorABI from "@/app/abis/SteleGovernor.json"
import ERC20VotesABI from "@/app/abis/ERC20Votes.json"
import { useProposalVoteResult, useProposalDetails } from "../../hooks/useProposals"
import { useQueryClient } from "@tanstack/react-query"
import { useBlockNumber } from "@/app/hooks/useBlockNumber"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useAppKitProvider } from '@reown/appkit/react'
import { ClientOnly } from "@/components/ClientOnly"

// Import separated components and utilities
import { VoteOption } from "./components"
import { openScanSite } from "./utils"
import { StatusBadge as StatusBadgeComponent } from "../../components"

interface ProposalDetailPageProps {
  params: Promise<{
    network: string
    id: string
  }>
}

export default function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const searchParams = useSearchParams()
  const { network: urlNetwork, id } = use(params)
  const { t } = useLanguage()
  const { walletType, getProvider, isConnected: walletConnected, address, isLoading: walletLoading } = useWallet()
    
  // Use URL network parameter for contracts and subgraph
  const contractNetwork = urlNetwork === 'ethereum' || urlNetwork === 'arbitrum' ? urlNetwork : 'ethereum'
  const subgraphNetwork = urlNetwork === 'ethereum' || urlNetwork === 'arbitrum' ? urlNetwork : 'ethereum'
  

  const [voteOption, setVoteOption] = useState<VoteOption>(null)
  const [reason, setReason] = useState("")
  const [isVoting, setIsVoting] = useState(false)
  const [votingPower, setVotingPower] = useState<string>("0")
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoadingVotingPower, setIsLoadingVotingPower] = useState(false)
  const [isDelegating, setIsDelegating] = useState(false)
  const [isQueuing, setIsQueuing] = useState(false)
  const [proposalState, setProposalState] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  
  // Fetch vote results from subgraph
  const { data: voteResultData, isLoading: isLoadingVoteResult } = useProposalVoteResult(id, subgraphNetwork)
  // Fetch proposal details for queue function
  const { data: proposalDetailsData, isLoading: isLoadingProposalDetails } = useProposalDetails(id, subgraphNetwork)
  // Get current block number with global caching
  const { data: blockInfo, isLoading: isLoadingBlockNumber } = useBlockNumber()
  const queryClient = useQueryClient()
  
  // Get vote result data or use defaults
  const voteResult = voteResultData?.proposalVoteResult
  
  // Parse proposal title from description (similar to vote page logic)
  const parseProposalDetails = (description: string) => {
    // Usually descriptions are in format "Title: Description"
    const parts = description.split(':')
    let title = ''
    let desc = description

    if (parts.length > 1) {
      title = parts[0].trim()
      desc = parts.slice(1).join(':').trim()
    } else {
      // If no colon separator, use first 50 characters as title
      if (description.length > 50) {
        title = description.substring(0, 50) + '...'
        desc = description
      } else {
        title = description
        desc = description
      }
    }

    return { title, description: desc }
  }

  // Extract proposal data from URL parameters
  const getProposalFromParams = () => {
    // Check if we have proposal details from subgraph first
    const subgraphProposal = proposalDetailsData?.proposalCreateds?.[0]
    
    const rawDescription = subgraphProposal?.description || 
                          searchParams.get('description') || 
                          'This proposal aims to increase the reward for the 1 week challenge from 100 USDC to 150 USDC to attract more participants.'
    const urlTitle = searchParams.get('title')
    
    // Parse title from description if not provided in URL
    const parsedDetails = parseProposalDetails(rawDescription)
    const title = urlTitle || parsedDetails.title || `Proposal #${id.slice(0, 8)}...`
    const description = parsedDetails.description
    const proposer = searchParams.get('proposer') || '0x1234...5678'
    const status = searchParams.get('status') || 'active'
    const startTimeStr = searchParams.get('startTime')
    const endTimeStr = searchParams.get('endTime')
    const votesForStr = searchParams.get('votesFor')
    const votesAgainstStr = searchParams.get('votesAgainst')
    const abstainStr = searchParams.get('abstain')
    const blockTimestamp = searchParams.get('blockTimestamp') || ''
    const blockNumber = searchParams.get('blockNumber') || ''
    const valuesStr = searchParams.get('values')
    // Use subgraph transaction hash if available, otherwise use URL param
    const transactionHash = subgraphProposal?.transactionHash || 
                            searchParams.get('transactionHash') || 
                            id // fallback to proposal ID if no transaction hash available
    // Get cached token info from URL parameters
    const cachedTokenBalance = searchParams.get('tokenBalance') || '0'
    const cachedDelegatedTo = searchParams.get('delegatedTo') || ''

    // Parse dates - if from URL params, use them; otherwise calculate based on subgraph data
    let startTime: Date
    let endTime: Date
    
    if (startTimeStr && endTimeStr) {
      // Use provided timestamps from URL
      startTime = new Date(startTimeStr)
      endTime = new Date(endTimeStr)
    } else if (subgraphProposal?.voteStart && subgraphProposal?.voteEnd && blockInfo) {
      // Calculate from blockchain data using network-specific block time
      const { calculateProposalTimestamps } = require('./utils/proposal-detail')
      const timestamps = calculateProposalTimestamps(
        subgraphProposal.voteStart,
        subgraphProposal.voteEnd,
        blockInfo.blockNumber,
        blockInfo.timestamp,
        subgraphNetwork
      )
      startTime = timestamps.startTime
      endTime = timestamps.endTime
    } else {
      // Fallback to default periods
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      endTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }

    // Parse vote counts (use subgraph data if available, otherwise use URL params)
    const votesFor = voteResult ? parseFloat(ethers.formatUnits(voteResult.forVotes, STELE_DECIMALS)) : 
                    (votesForStr ? parseFloat(votesForStr) : 0)
    const votesAgainst = voteResult ? parseFloat(ethers.formatUnits(voteResult.againstVotes, STELE_DECIMALS)) : 
                        (votesAgainstStr ? parseFloat(votesAgainstStr) : 0)
    const abstain = voteResult ? parseFloat(ethers.formatUnits(voteResult.abstainVotes, STELE_DECIMALS)) : 
                   (abstainStr ? parseFloat(abstainStr) : 0)

    // Parse values array
    let values: string[] = []
    try {
      values = valuesStr ? JSON.parse(valuesStr) : []
    } catch (error) {
      console.error('Error parsing values:', error)
      values = []
    }

    // Determine if proposer is full address or abbreviated
    const isFullAddress = proposer.length === 42 && proposer.startsWith('0x')
    const fullProposer = isFullAddress ? proposer : '0x1234567890abcdef1234567890abcdef12345678' // fallback for abbreviated
    const displayProposer = isFullAddress ? `${proposer.slice(0, 6)}...${proposer.slice(-4)}` : proposer

    return {
      id: id,
      title,
      description,
      proposer: displayProposer,
      fullProposer: fullProposer,
      status,
      votesFor,
      votesAgainst,
      abstain,
      startTime,
      endTime,
      blockTimestamp,
      blockNumber,
      values,
      transactionHash,
      details: description, // Use description as details for now
      hasVoted: hasVoted,
      // Cached token info from parent page
      cachedTokenBalance,
      cachedDelegatedTo,
    }
  }

  // Get proposal data (from URL params or defaults)
  const proposal = getProposalFromParams()



  // Set current time on client side only
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString())
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Create providers as refs to reuse them
  const providersRef = useRef<{ 
    network?: ethers.JsonRpcProvider; 
    ethereum?: ethers.JsonRpcProvider;
    lastBlockTime?: number;
    lastBlockNumber?: number;
  }>({});

  // Internal function to check voting power (without debouncing)
  const _checkVotingPowerAndStatus = useCallback(async () => {
    if (!walletConnected || !id) return

    setIsLoadingVotingPower(true)
    try {
      // Check if wallet is connected
      if (!walletConnected || !walletType) {
        throw new Error("No wallet connected. Please connect your wallet first.");
        }
        
      // Get current connected address from wallet
      let currentConnectedAddress: string;
      
      if (walletType === 'walletconnect') {
        // For WalletConnect, use the address from useWallet hook
        if (!address) {
          throw new Error("No WalletConnect address available")
        }
        currentConnectedAddress = address;
      } else {
        // For MetaMask and Phantom, use provider method
        const browserProvider = getProvider();
        if (!browserProvider) {
          throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
        }

        const accounts = await browserProvider.send('eth_requestAccounts', []);
        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts connected in ${walletType} wallet`)
        }
        currentConnectedAddress = accounts[0];
      }
      
      // Use managed provider to prevent multiple connections
      const provider = getManagedProvider(contractNetwork)
      const governanceContract = new ethers.Contract(getGovernanceContractAddress(contractNetwork), GovernorABI.abi, provider)

      // For cross-chain governance, we need to use Ethereum block numbers for voting power queries
      // Cache block number for 30 seconds to reduce RPC calls
      let ethereumBlock: number
      const now = Date.now()
      if (providersRef.current.lastBlockTime && 
          providersRef.current.lastBlockNumber &&
          now - providersRef.current.lastBlockTime < 30000) {
        // Use cached block number if it's less than 30 seconds old
        ethereumBlock = providersRef.current.lastBlockNumber
      } else {
        try {
          // Use managed provider for Ethereum
          const ethereumProvider = getManagedProvider('ethereum')
          ethereumBlock = await ethereumProvider.getBlockNumber()
          // Cache the block number
          providersRef.current.lastBlockNumber = ethereumBlock
          providersRef.current.lastBlockTime = now
        } catch (ethereumError) {
          console.warn('Failed to get Ethereum block, falling back to network block:', ethereumError)
          // Fallback to current network block
          ethereumBlock = await provider.getBlockNumber()
        }
      }
      
      // Batch RPC calls using Promise.all to reduce latency
      const timepoint = Math.max(1, ethereumBlock - 10)
      
      // Create cache key for voting power
      const votingPowerCacheKey = `${currentConnectedAddress}-${timepoint}-${contractNetwork}`
      
      // Check cache first for voting power
      const cachedVotingPower = providerManager.getCachedVotingPower(votingPowerCacheKey)
      
      let hasUserVoted, userVotingPower
      
      if (cachedVotingPower) {
        // Use cached voting power but still check hasVoted (this changes frequently)
        [hasUserVoted] = await Promise.all([
          governanceContract.hasVoted(id, currentConnectedAddress)
        ])
        userVotingPower = cachedVotingPower
      } else {
        // Fetch both values
        [hasUserVoted, userVotingPower] = await Promise.all([
          governanceContract.hasVoted(id, currentConnectedAddress),
          governanceContract.getVotes(currentConnectedAddress, timepoint)
        ])
        
        // Cache the voting power
        providerManager.setCachedVotingPower(votingPowerCacheKey, userVotingPower)
      }
      
      setHasVoted(hasUserVoted)
      setVotingPower(ethers.formatUnits(userVotingPower, STELE_DECIMALS))      
    } catch (error: any) {
      console.error('Error checking voting power and status:', error)
      
      // Handle specific errors
      let errorMessage = "Failed to check voting power. Please try again."
      
      if (error.message?.includes("future lookup")) {
        errorMessage = "Block synchronization issue. Please wait a moment and try again."
      } else if (error.message?.includes("invalid proposal id")) {
        errorMessage = "Invalid proposal ID. Please check the proposal exists."
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "Contract call failed. Please check your connection and try again."
      }
      
      // Only show toast for non-future-lookup errors to avoid spam
      if (!error.message?.includes("future lookup")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        })
      }
    } finally {
      setIsLoadingVotingPower(false)
    }
  }, [walletConnected, id, walletType, contractNetwork, address, getProvider])

  // Debounced version of voting power check
  const checkVotingPowerAndStatus = useCallback(async () => {
    if (!walletConnected || !id) return
    
    const debounceKey = `voting-power-${id}-${address}-${contractNetwork}`
    return providerManager.debounce(debounceKey, _checkVotingPowerAndStatus)
  }, [walletConnected, id, address, contractNetwork, _checkVotingPowerAndStatus])

  // Check proposal state
  const checkProposalState = useCallback(async () => {
    if (!id) return

    try {
      // Validate proposal ID format (should be a large number)
      if (!/^\d+$/.test(id)) {
        console.warn('Invalid proposal ID format:', id)
        return
      }

      // Use managed provider to prevent multiple connections
      const provider = getManagedProvider(contractNetwork)
      
      const governanceContract = new ethers.Contract(getGovernanceContractAddress(contractNetwork), GovernorABI.abi, provider)

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const state = await Promise.race([
        governanceContract.state(id),
        timeoutPromise
      ])
      
      // Convert BigInt to number to ensure proper comparison
      setProposalState(Number(state))
    } catch (error) {
      console.error('Error checking proposal state:', error)
      // Don't show user-facing error for state check failures
      // as this is just for UI enhancement
    }
  }, [id, contractNetwork])

  // Check voting power and voting status when wallet is connected
  useEffect(() => {
    if (walletConnected && id) {
      checkVotingPowerAndStatus()
      checkProposalState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected, id]) // Intentionally excluded functions to prevent infinite loops

  // Calculate vote percentage based on total supply (1 billion STELE)
  const calculatePercentage = () => {
    // Convert STELE_TOTAL_SUPPLY from wei to STELE tokens
    const totalSupplyInStele = parseFloat(ethers.formatUnits(STELE_TOTAL_SUPPLY, STELE_DECIMALS))
    
    // Calculate percentage based on total supply
    return {
      for: ((proposal.votesFor / totalSupplyInStele) * 100).toFixed(2),
      against: ((proposal.votesAgainst / totalSupplyInStele) * 100).toFixed(2),
      abstain: ((proposal.abstain / totalSupplyInStele) * 100).toFixed(2),
    }
  }

  // Delegate tokens to self
  const handleDelegate = async () => {
    // Check if wallet is connected
    if (!walletConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsDelegating(true)

    try {
      // Get current connected address from wallet and provider
      let currentConnectedAddress: string;
      let browserProvider: any;
      
      if (walletType === 'walletconnect') {
        // For WalletConnect, use the address from useWallet hook
        if (!address) {
          throw new Error("No WalletConnect address available")
        }
        currentConnectedAddress = address;
        browserProvider = getProvider();
      } else {
        // For MetaMask and Phantom, use provider method
        browserProvider = getProvider();
        if (!browserProvider) {
          throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
        }

        const accounts = await browserProvider.send('eth_requestAccounts', [])
        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts connected in ${walletType} wallet. Please connect your wallet first.`)
        }
        currentConnectedAddress = accounts[0];
      }

      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
      }

      // Use browserProvider and get signer
      const signer = await browserProvider.getSigner()
      const votesContract = new ethers.Contract(getSteleTokenAddress(contractNetwork), ERC20VotesABI.abi, signer)

      // Delegate to self (current connected address)
      const tx = await votesContract.delegate(currentConnectedAddress)

      toast({
        title: "Transaction Submitted",
        description: "Your delegation is being processed...",
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      toast({
        title: "Delegation Successful",
        description: `You have successfully delegated your tokens to yourself (${currentConnectedAddress.slice(0, 6)}...${currentConnectedAddress.slice(-4)}). Your voting power should now be available.`,
        action: (
          <ToastAction 
            altText={`View on ${contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
            onClick={() => openScanSite(contractNetwork, 'tx', receipt.hash)}
          >
            View on {contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}
          </ToastAction>
        ),
      })

      // Refresh voting power after delegation
      setTimeout(() => {
        checkVotingPowerAndStatus()
      }, 3000)

    } catch (error: any) {
      console.error("Delegation error:", error)
      
      let errorMessage = "There was an error delegating your tokens. Please try again."
      let isUserRejection = false
      
      // Check for various user rejection patterns
      if (error.code === 4001 || 
          error.code === "ACTION_REJECTED" ||
          error.message?.includes("rejected") ||
          error.message?.includes("denied") ||
          error.message?.includes("cancelled") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.message?.includes("Transaction was rejected")) {
        errorMessage = "Transaction was rejected by user"
        isUserRejection = true
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
      } else if (error.message?.includes("No accounts connected")) {
        errorMessage = "No accounts connected in Phantom wallet. Please connect your wallet first."
      }

      // Only show error toast for non-user-rejection errors
      if (!isUserRejection) {
        toast({
          variant: "destructive",
          title: "Delegation Failed",
          description: errorMessage,
        })
      }
    } finally {
      // Always ensure loading state is cleared, even if there are unexpected errors
      setIsDelegating(false)
    }
  }

  // Vote function
  const handleVote = async () => {
    if (!voteOption) {
      toast({
        variant: "destructive",
        title: "Vote Option Required",
        description: "Please select a vote option",
      })
      return
    }

    // Wallet connection check
    if (!walletConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote",
      })
      return
    }

    // Check if user has voting power
    if (Number(votingPower) === 0) {
      toast({
        variant: "destructive",
        title: "No Voting Power",
        description: "You don't have any voting power for this proposal",
      })
      return
    }

    // Check if wallet is connected
    if (!walletConnected || !walletType) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    setIsVoting(true)

    try {
      // Get current connected address from wallet and provider
      let currentConnectedAddress: string;
      let browserProvider: any;
      
      if (walletType === 'walletconnect') {
        // For WalletConnect, use the address from useWallet hook
        if (!address) {
          throw new Error("No WalletConnect address available")
        }
        currentConnectedAddress = address;
        browserProvider = getProvider();
      } else {
        // For MetaMask and Phantom, use provider method
        browserProvider = getProvider();
        if (!browserProvider) {
          throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
        }

        const accounts = await browserProvider.send('eth_requestAccounts', [])
        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts connected in ${walletType} wallet`)
        }
        currentConnectedAddress = accounts[0];
      }

      if (!browserProvider) {
        throw new Error("Failed to get wallet provider. Please reconnect your wallet.");
      }
      
      // Use browserProvider and get signer
      const signer = await browserProvider.getSigner()
      const contract = new ethers.Contract(getGovernanceContractAddress(contractNetwork), GovernorABI.abi, signer)

      // Convert vote option to support value
      // 0 = Against, 1 = For, 2 = Abstain
      let support: number
      switch (voteOption) {
        case 'for':
          support = 1
          break
        case 'against':
          support = 0
          break
        case 'abstain':
          support = 2
          break
        default:
          throw new Error("Invalid vote option")
      }

      let tx
      if (reason.trim()) {
        // Cast vote with reason
        tx = await contract.castVoteWithReason(id, support, reason.trim())
      } else {
        // Cast vote without reason
        tx = await contract.castVote(id, support)
      }

      toast({
        title: "Transaction Submitted",
        description: "Your vote is being processed...",
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      // Vote success message
      toast({
        title: "Vote Cast Successfully",
        description: `You have voted ${voteOption} on proposal ${id} with ${Number(votingPower).toLocaleString()} voting power`,
        action: (
          <ToastAction 
            altText={`View on ${contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
            onClick={() => window.open(`${contractNetwork === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'}/tx/${receipt.hash}`, '_blank')}
          >
            View on {contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}
          </ToastAction>
        ),
      })

      // Update voting status
      setHasVoted(true)
      
      // Invalidate and refetch vote result data
      queryClient.invalidateQueries({ queryKey: ['proposalVoteResult', id] })
      
      // Refresh voting power and status
      setTimeout(() => {
        checkVotingPowerAndStatus()
      }, 3000)

    } catch (error: any) {
      console.error("Voting error:", error)
      
      let errorMessage = "There was an error casting your vote. Please try again."
      let isUserRejection = false
      
      // Check for various user rejection patterns
      if (error.code === 4001 || 
          error.code === "ACTION_REJECTED" ||
          error.message?.includes("rejected") ||
          error.message?.includes("denied") ||
          error.message?.includes("cancelled") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.message?.includes("Transaction was rejected")) {
        errorMessage = "Transaction was rejected by user"
        isUserRejection = true
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message?.includes("already voted")) {
        errorMessage = "You have already voted on this proposal"
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
      } else if (error.message?.includes("No accounts connected")) {
        errorMessage = "No accounts connected in Phantom wallet. Please connect your wallet first."
      }

      // Only show error toast for non-user-rejection errors
      if (!isUserRejection) {
        toast({
          variant: "destructive",
          title: "Voting Failed",
          description: errorMessage,
        })
      }
    } finally {
      // Always ensure loading state is cleared, even if there are unexpected errors
      setIsVoting(false)
    }
  }

  // Handle queue operation
  const handleQueue = async () => {
    if (!walletConnected || !proposalDetailsData?.proposalCreateds?.[0]) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or proposal data not available.",
      })
      return
    }

    const proposalDetails = proposalDetailsData.proposalCreateds[0]
    
    setIsQueuing(true)
    try {
      // WalletConnect only - use getProvider from useWallet hook
      const provider = getProvider();
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.");
      }

      // Connect to provider with signer
      const signer = await provider.getSigner()
      const governanceContract = new ethers.Contract(getGovernanceContractAddress(contractNetwork), GovernorABI.abi, signer)

      // Prepare queue parameters
      const targets = proposalDetails.targets || []
      const values = proposalDetails.values || []
      const calldatas = proposalDetails.calldatas || []
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))

      // Call queue function
      const tx = await governanceContract.queue(targets, values, calldatas, descriptionHash)
      
      toast({
        title: "Transaction Submitted",
        description: "Your queue transaction has been submitted. Please wait for confirmation.",
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        toast({
          title: "Proposal Queued Successfully",
          description: `Proposal #${id} has been queued for execution.`,
          action: (
            <ToastAction altText="View transaction">
              <a 
                href={`https://etherscan.io/tx/${receipt.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Transaction
              </a>
            </ToastAction>
          ),
        })
        
        // Refresh proposal state
        await checkProposalState()
      } else {
        throw new Error('Transaction failed')
      }

    } catch (error: any) {
      console.error("Queue error:", error)
      
      let errorMessage = "There was an error queuing the proposal. Please try again."
      let isUserRejection = false
      
      // Check for various user rejection patterns
      if (error.code === 4001 || 
          error.code === "ACTION_REJECTED" ||
          error.message?.includes("rejected") ||
          error.message?.includes("denied") ||
          error.message?.includes("cancelled") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.message?.includes("Transaction was rejected")) {
        errorMessage = "Transaction was rejected by user"
        isUserRejection = true
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
      } else if (error.message?.includes("Governor: proposal not successful")) {
        errorMessage = "Proposal has not succeeded yet and cannot be queued"
      }

      // Only show error toast for non-user-rejection errors
      if (!isUserRejection) {
        toast({
          variant: "destructive",
          title: "Queue Failed",
          description: errorMessage,
        })
      }
    } finally {
      // Always ensure loading state is cleared, even if there are unexpected errors
      setIsQueuing(false)
    }
  }

  // Handle execute operation
  const handleExecute = async () => {
    if (!walletConnected || !proposalDetailsData?.proposalCreateds?.[0]) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Wallet not connected or proposal data not available.",
      })
      return
    }

    const proposalDetails = proposalDetailsData.proposalCreateds[0]
    
    setIsExecuting(true)
    try {
      // WalletConnect only - use getProvider from useWallet hook
      const provider = getProvider();
      if (!provider || walletType !== 'walletconnect') {
        throw new Error("WalletConnect not available. Please connect your wallet first.");
      }

      // Connect to provider with signer
      const signer = await provider.getSigner()
      const governanceContract = new ethers.Contract(getGovernanceContractAddress(contractNetwork), GovernorABI.abi, signer)

      // Double-check proposal state before executing
      let currentState
      try {
        currentState = await governanceContract.state(id)
      } catch (stateError) {
        console.error('Error checking proposal state:', stateError)
        throw new Error('Unable to verify proposal state. Please try again.')
      }
      
      const numericState = Number(currentState)
      if (numericState !== 5) {
        throw new Error(`Proposal is not in queued state. Current state: ${numericState}`)
      }

      // Prepare execute parameters
      const targets = proposalDetails.targets || []
      const values = proposalDetails.values || []
      const calldatas = proposalDetails.calldatas || []
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDetails.description))

      // Try to estimate gas first to catch potential issues
      try {
        await governanceContract.execute.estimateGas(targets, values, calldatas, descriptionHash)
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError)
        throw new Error('Transaction would fail. The proposal may not be ready for execution or the timelock period has not expired.')
      }

      // Call execute function
      const tx = await governanceContract.execute(targets, values, calldatas, descriptionHash)
      
      toast({
        title: "Transaction Submitted",
        description: "Your execute transaction has been submitted. Please wait for confirmation.",
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        toast({
          title: "Proposal Executed Successfully",
          description: `Proposal #${id} has been executed successfully!`,
          action: (
            <ToastAction altText="View transaction">
              <a 
                href={`https://etherscan.io/tx/${receipt.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Transaction
              </a>
            </ToastAction>
          ),
        })
        
        // Refresh proposal state
        await checkProposalState()
      } else {
        throw new Error('Transaction failed')
      }

    } catch (error: any) {
      console.error("Execute error:", error)
      
      let errorMessage = "There was an error executing the proposal. Please try again."
      let isUserRejection = false
      
      // Check for various user rejection patterns
      if (error.code === 4001 || 
          error.code === "ACTION_REJECTED" ||
          error.message?.includes("rejected") ||
          error.message?.includes("denied") ||
          error.message?.includes("cancelled") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.message?.includes("Transaction was rejected")) {
        errorMessage = "Transaction was rejected by user"
        isUserRejection = true
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message?.includes("not in queued state")) {
        errorMessage = "Proposal is not in queued state"
      } else if (error.message?.includes("timelock")) {
        errorMessage = "Timelock period has not expired yet. Please wait before executing."
      } else if (error.message?.includes("would fail")) {
        errorMessage = error.message
      } else if (error.code === "CALL_EXCEPTION") {
        errorMessage = "Transaction would fail. The proposal may not be ready for execution or the timelock period hasn't expired."
      } else if (error.message?.includes("Unable to verify")) {
        errorMessage = error.message
      } else if (error.message?.includes("Phantom wallet is not installed")) {
        errorMessage = "Phantom wallet is not installed or Ethereum support is not enabled"
      }

      // Only show error toast for non-user-rejection errors
      if (!isUserRejection) {
        toast({
          variant: "destructive",
          title: "Execute Failed",
          description: errorMessage,
        })
      }
    } finally {
      // Always ensure loading state is cleared, even if there are unexpected errors
      setIsExecuting(false)
    }
  }

  // Check if proposal is ready for queue (pending queue status)
  const isReadyForQueue = () => {
    const now = new Date()
    const voteEndTime = proposal.endTime
    
    // Check if voting period has ended
    const votingEnded = now > voteEndTime
    
    // Check if majority voted for (more than 50% of votes cast)
    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.abstain
    const hasMajority = totalVotes > 0 && proposal.votesFor > proposal.votesAgainst
    
    // Check if there are enough votes (at least some participation)
    const hasMinimumParticipation = totalVotes > 0
    
    // Also check if proposal state is succeeded (4) if available - this is the most reliable check
    const isSucceeded = proposalState === 4
    
    // If we have proposal state, use it as the primary check
    if (proposalState !== null) {
      return isSucceeded
    }
    
    // Fallback to manual calculation if proposal state is not available
    return votingEnded && hasMajority && hasMinimumParticipation
  }

  // Date formatting function
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    // Check if proposal is ready for queue but not yet queued
    if (isReadyForQueue() && proposalState !== 5) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/70 border border-orange-600/50 text-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          {t('pendingQueue')}
        </div>
      )
    }

    // Show proposal state if available
    if (proposalState !== null) {
      switch (proposalState) {
        case 0: // Pending
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/70 border border-yellow-600/50 text-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              {t('pending')}
            </div>
          )
        case 1: // Active
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/70 border border-green-600/50 text-green-200">
              <Clock className="w-3 h-3 mr-1" />
              {t('active')}
            </div>
          )
        case 2: // Canceled
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/70 border border-red-600/50 text-red-200">
              <FileText className="w-3 h-3 mr-1" />
              {t('canceled')}
            </div>
          )
        case 3: // Defeated
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/70 border border-red-600/50 text-red-200">
              <FileText className="w-3 h-3 mr-1" />
              {t('defeated')}
            </div>
          )
        case 4: // Succeeded
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 border border-blue-600/50 text-blue-200">
              <Check className="w-3 h-3 mr-1" />
              {t('succeeded')}
            </div>
          )
        case 5: // Queued
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/70 border border-purple-600/50 text-purple-200">
              <Clock className="w-3 h-3 mr-1" />
              {t('queued')}
            </div>
          )
        case 6: // Expired
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800/70 border border-gray-600/50 text-gray-300">
              <FileText className="w-3 h-3 mr-1" />
              {t('expired')}
            </div>
          )
        case 7: // Executed
          return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/70 border border-green-600/50 text-green-200">
              <Check className="w-3 h-3 mr-1" />
              {t('executed')}
            </div>
          )
        default:
          break
      }
    }

    // Fallback to original status logic
    if (status === 'active') {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/70 border border-green-600/50 text-green-200">
          <Clock className="w-3 h-3 mr-1" />
          {t('active')}
        </div>
      )
    } else if (status === 'completed') {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/70 border border-blue-600/50 text-blue-200">
          <Check className="w-3 h-3 mr-1" />
          {t('completed')}
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/70 border border-red-600/50 text-red-200">
          <FileText className="w-3 h-3 mr-1" />
          {t('defeated')}
        </div>
      )
    }
  }

  // Add click handlers for scan site navigation
  const handleProposalIdClick = () => {
    // Use the proposal transaction hash
    if (proposal.transactionHash) {
      openScanSite(contractNetwork, 'tx', proposal.transactionHash)
    }
  }
  
  const handleProposerClick = () => {
    openScanSite(contractNetwork, 'address', proposal.fullProposer)
  }

  return (
    <div className="container mx-auto px-2 py-6">
      <div className="mb-4">
        <Link href="/vote">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToProposals')}
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal details */}
        <div className="lg:col-span-2">
          <Card className="bg-muted border-gray-700/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
                    {contractNetwork === 'arbitrum' ? (
                      <Image
                        src="/networks/small/arbitrum.png"
                        alt="Arbitrum"
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/networks/small/ethereum.png"
                        alt="Ethereum"
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    )}
                    {proposal.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-400">
                    <span 
                      className="cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={handleProposalIdClick}
                      title={`View transaction on ${contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
                    >
                      Proposal #{id.slice(0, 8)}...{id.slice(-8)}
                    </span>
                  </CardDescription>
                </div>
                <StatusBadgeComponent proposal={{...proposal, proposalId: proposal.id, status: proposal.status as any}} t={t} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{t('proposer')}: </span>
                  <span 
                    className="cursor-pointer hover:text-blue-400 transition-colors ml-1"
                    onClick={handleProposerClick}
                    title={`View proposer on ${contractNetwork === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}`}
                  >
                    {proposal.proposer}
                  </span>
                </div>
                <ClientOnly fallback={
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t('voteStart')}: Loading...</span>
                  </div>
                }>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t('voteStart')}: {formatDate(proposal.startTime)}</span>
                  </div>
                </ClientOnly>
                <ClientOnly fallback={
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t('voteEnd')}: Loading...</span>
                  </div>
                }>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t('voteEnd')}: {formatDate(proposal.endTime)}</span>
                  </div>
                </ClientOnly>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-100">{t('description')}</h3>
                <div className="prose max-w-none dark:prose-invert">
                  <p className="text-gray-300 break-words whitespace-pre-wrap overflow-wrap-anywhere">{proposal.description}</p>
                </div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-100">{t('proposalDetails')}</h3>
                <div className="prose max-w-none dark:prose-invert">
                  <p className="text-gray-300 break-words whitespace-pre-wrap overflow-wrap-anywhere">{proposal.details}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Voting component */}
        <div>
          <Card className="bg-muted border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-gray-100">{t('castYourVote')}</CardTitle>
              <CardDescription className="text-gray-300">
                {proposal.hasVoted 
                  ? t('youHaveAlreadyVoted')
                  : t('selectYourVotingOption')
                }
              </CardDescription>
              
              {/* Debug Information */}
              <ClientOnly fallback={
                <div className="text-sm bg-gray-800/50 border border-gray-600 p-4 rounded-md space-y-2 text-gray-300">
                  <div className="text-gray-300">⏰ {t('currentTime')}: <span className="font-semibold text-gray-100">Loading...</span></div>
                  <div className="text-gray-300">📅 {t('voteEndTime')}: <span className="font-semibold text-gray-100">Loading...</span></div>
                  <div className="text-gray-300">👍 {t('votesFor')}: <span className="font-semibold text-green-400">{proposal.votesFor.toLocaleString()}</span></div>
                  <div className="text-gray-300">👎 {t('votesAgainst')}: <span className="font-semibold text-red-400">{proposal.votesAgainst.toLocaleString()}</span></div>
                  <div className="text-gray-300">🤷 {t('abstainVotes')}: <span className="font-semibold text-gray-400">{proposal.abstain.toLocaleString()}</span></div>
                  <div className="text-gray-300">📊 {t('totalVotes')}: <span className="font-semibold text-gray-100">{(proposal.votesFor + proposal.votesAgainst + proposal.abstain).toLocaleString()}</span></div>
                </div>
              }>
                <div className="text-sm bg-gray-800/50 border border-gray-600 p-4 rounded-md space-y-2 text-gray-300">
                  <div className="text-gray-300">⏰ {t('currentTime')}: <span className="font-semibold text-gray-100">{currentTime || 'Loading...'}</span></div>
                  <div className="text-gray-300">📅 {t('voteEndTime')}: <span className="font-semibold text-gray-100">{proposal.endTime.toLocaleString()}</span></div>
                  <div className="text-gray-300">👍 {t('votesFor')}: <span className="font-semibold text-green-400">{proposal.votesFor.toLocaleString()}</span></div>
                  <div className="text-gray-300">👎 {t('votesAgainst')}: <span className="font-semibold text-red-400">{proposal.votesAgainst.toLocaleString()}</span></div>
                  <div className="text-gray-300">🤷 {t('abstainVotes')}: <span className="font-semibold text-gray-400">{proposal.abstain.toLocaleString()}</span></div>
                  <div className="text-gray-300">📊 {t('totalVotes')}: <span className="font-semibold text-gray-100">{(proposal.votesFor + proposal.votesAgainst + proposal.abstain).toLocaleString()}</span></div>
                </div>
              </ClientOnly>

              {walletLoading && (
                <div className="text-sm text-gray-400 space-y-1">
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    {t('connecting')}
                  </div>
                </div>
              )}

              {walletConnected && !walletLoading && (
                <div className="text-sm text-gray-400 space-y-1">
                  {isLoadingVotingPower ? (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t('loadingVotingPower')}
                    </div>
                  ) : (
                    <>
                      <div>{t('userVotingPower')}: {Number(votingPower).toLocaleString()}</div>
                      {proposalState !== null && (
                        <div>{t('status')}: {
                          isReadyForQueue() && proposalState !== 5 ? t('pendingQueue') :
                          proposalState === 0 ? t('pending') :
                          proposalState === 1 ? t('active') :
                          proposalState === 2 ? t('canceled') :
                          proposalState === 3 ? t('defeated') :
                          proposalState === 4 ? t('succeeded') :
                          proposalState === 5 ? t('queued') :
                          proposalState === 6 ? t('expired') :
                          proposalState === 7 ? t('executed') :
                          t('unknown')
                        }</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Voting UI - Only show during Active voting period (proposalState === 1) */}
              {proposalState === 1 && (
                <div className="space-y-4">
                  <RadioGroup 
                    value={voteOption || ""} 
                    onValueChange={(value) => setVoteOption(value as VoteOption)}
                    disabled={proposal.hasVoted || isVoting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="for" id="for" />
                      <Label htmlFor="for">{t('voteFor')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="against" id="against" />
                      <Label htmlFor="against">{t('voteAgainst')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="abstain" id="abstain" />
                      <Label htmlFor="abstain">{t('abstain')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              {/* Status message when not in voting period */}
              {proposalState !== 1 && proposalState !== null && (
                <div className="text-center py-4 text-gray-400">
                  {proposalState === 0 && t('proposalVotingNotStarted')}
                  {proposalState === 2 && t('proposalCanceled')}
                  {proposalState === 3 && t('proposalDefeated')}
                  {proposalState === 4 && t('proposalSucceededReadyToQueue')}
                  {proposalState === 5 && t('proposalQueuedReadyForExecution')}
                  {proposalState === 6 && t('proposalExpired')}
                  {proposalState === 7 && t('proposalExecuted')}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              {/* Voting Period UI - Only show during Active voting period (proposalState === 1) */}
              {proposalState === 1 && (
                <>
                  {/* Delegate Button - Show when user has tokens but no voting power */}
                  {walletConnected && !walletLoading && !isLoadingVotingPower && parseFloat(proposal.cachedTokenBalance) > 0 && Number(votingPower) === 0 && (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600" 
                      onClick={handleDelegate}
                      disabled={isDelegating}
                    >
                      {isDelegating ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('delegating')}
                        </div>
                      ) : (
                        <>
                          <VoteIcon className="mr-2 h-4 w-4" />
                          {t('delegateTokensToEnableVoting')}
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Submit Vote Button */}
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600" 
                    onClick={handleVote}
                    disabled={proposal.hasVoted || !voteOption || isVoting || walletLoading || !walletConnected || Number(votingPower) === 0 || isLoadingVotingPower}
                  >
                    {isVoting ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('submittingVote')}
                      </div>
                    ) : proposal.hasVoted ? (
                      t('alreadyVoted')
                    ) : walletLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('connecting')}
                      </div>
                    ) : !walletConnected ? (
                      t('connectWallet')
                    ) : Number(votingPower) === 0 ? (
                        t('insufficientVotingPower')
                    ) : isLoadingVotingPower ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('checkingVotingPower')}
                      </div>
                    ) : (
                      <>
                        <VoteIcon className="mr-2 h-4 w-4" />
                        {t('submitVote')}
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Queue Button - Show when proposal is succeeded (state 4) */}
              {walletConnected && !walletLoading && proposalState === 4 && (
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600" 
                  onClick={handleQueue}
                  disabled={isQueuing || isLoadingProposalDetails}
                >
                  {isQueuing ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('queuingProposal')}
                    </div>
                  ) : isLoadingProposalDetails ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loadingProposalData')}
                    </div>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      {t('queueForExecution')}
                    </>
                  )}
                </Button>
              )}

              {/* Execute Button - Show when proposal is queued (state 5) */}
              {walletConnected && !walletLoading && proposalState === 5 && (
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600" 
                  onClick={handleExecute}
                  disabled={isExecuting || isLoadingProposalDetails}
                >
                  {isExecuting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('executingProposal')}
                    </div>
                  ) : isLoadingProposalDetails ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loadingProposalData')}
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t('executeProposal')}
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 