'use client'

import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'
import { NETWORK_SUBGRAPHS, getFundHeaders } from '@/lib/constants'
import { useFundInvestorData } from './useFundInvestorData'

// Query single fundShare by ID (fundId)
const GET_FUND_SHARE_QUERY = `
  query GetFundShare($fundId: String!) {
    fundShare(id: $fundId) {
      id
      fundId
      totalShare
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

// Query single investorShare by ID (fundId-investor)
const GET_INVESTOR_SHARE_QUERY = `
  query GetInvestorShare($investorShareId: String!) {
    investorShare(id: $investorShareId) {
      id
      fundId
      investor
      share
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

export interface FundShare {
  id: string
  fundId: string
  totalShare: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface InvestorShare {
  id: string
  fundId: string
  investor: string
  share: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export function useFundSharePercentage(fundId: string, investor: string, network: 'ethereum' | 'arbitrum' = 'arbitrum') {
  // Use the same network URL pattern as other working queries
  const fundNetwork = network === 'arbitrum' ? 'arbitrum_fund' : 'ethereum_fund'
  const subgraphUrl = NETWORK_SUBGRAPHS[fundNetwork]
  
  // Get investor data using the working hook
  const { data: investorData, isLoading: isInvestorLoading } = useFundInvestorData(fundId, investor, network)

  // Try to get fund share directly by ID
  const { data: fundShareData, isLoading: isFundShareLoading, error: fundShareError } = useQuery({
    queryKey: ['fundShare', fundId, network],
    queryFn: async () => {
      try {
        const data = await request(subgraphUrl, GET_FUND_SHARE_QUERY, {
          fundId: fundId
        }, getFundHeaders())
        
        return data
      } catch (error) {
        console.error('❌ FundShare query failed:', error)
        return { fundShare: null }
      }
    },
    enabled: !!fundId,
    staleTime: 30000,
  })

  // Use same ID format as useFundInvestorData (toUpperCase)
  const investorShareId = `${fundId}-${investor.toUpperCase()}`
  
  const { data: investorShareData, isLoading: isInvestorShareLoading, error: investorShareError } = useQuery({
    queryKey: ['investorShare', investorShareId, network],
    queryFn: async () => {
      try {        
        const data = await request(subgraphUrl, GET_INVESTOR_SHARE_QUERY, {
          investorShareId: investorShareId
        }, getFundHeaders())
        
        return data
      } catch (error) {
        console.error('❌ InvestorShare query failed:', error)
        return { investorShare: null }
      }
    },
    enabled: !!investor && !!fundId,
    staleTime: 30000,
  })

  const sharePercentage = (() => {
    // Try to use fundShare and investor data
    const fundShare = (fundShareData as any)?.fundShare
    const investorShare = (investorShareData as any)?.investorShare
    
    // Method 1: Use FundShare + InvestorShare entities
    if (fundShare && investorShare) {
      const totalShare = parseFloat(fundShare.totalShare)
      const myShare = parseFloat(investorShare.share)
            
      if (totalShare > 0) {
        const percentage = (myShare / totalShare) * 100
        return percentage
      }
    }
    
    // Method 2: Use FundShare + Investor.share (fallback)
    if (fundShare && investorData?.investor?.share) {
      const totalShare = parseFloat(fundShare.totalShare)
      const myShare = parseFloat(investorData.investor.share)
            
      if (totalShare > 0) {
        const percentage = (myShare / totalShare) * 100
        return percentage
      }
    }

    return 0
  })()

  return {
    sharePercentage,
    isLoading: isFundShareLoading || isInvestorShareLoading || isInvestorLoading,
    fundShare: (fundShareData as any)?.fundShare || null,
    investorShare: (investorShareData as any)?.investorShare || null
  }
}