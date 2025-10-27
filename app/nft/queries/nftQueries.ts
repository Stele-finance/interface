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
    challengeType
    user
    totalUsers
    rank
    seedMoney
    finalScore
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
  challengeType: number
  user: string
  totalUsers: number
  rank: number
  seedMoney: string
  finalScore: string
  returnRate: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface NFTData {
  performanceNFTs: PerformanceNFT[]
}