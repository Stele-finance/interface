import { gql } from 'graphql-request'

export const getAllNFTsQuery = () => gql`{
  performanceNFTs(
    orderBy: returnRate
    orderDirection: desc
    first: 1000
  ) {
    id
    tokenId
    challengeId
    user
    rank
    returnRate
    blockNumber
    blockTimestamp
    transactionHash
  }
}`

export interface PerformanceNFT {
  id: string
  tokenId: string
  challengeId: string
  user: string
  rank: number
  returnRate: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface NFTData {
  performanceNFTs: PerformanceNFT[]
}