import { gql } from 'graphql-request'

export const getAllFundNFTsQuery = () => gql`{
  managerNFTs(
    orderBy: returnRate
    orderDirection: desc
    first: 1000
  ) {
    id
    tokenId
    fundId
    manager
    owner
    investment
    currentTVL
    returnRate
    fundCreated
    mintedAt
    lastUpdatedAt
    transferCount
  }
}`

export interface ManagerNFT {
  id: string
  tokenId: string
  fundId: string
  manager: string
  owner: string
  investment: string
  currentTVL: string
  returnRate: string
  fundCreated: string
  mintedAt: string
  lastUpdatedAt: string
  transferCount: string
}

export interface FundNFTData {
  managerNFTs: ManagerNFT[]
}
