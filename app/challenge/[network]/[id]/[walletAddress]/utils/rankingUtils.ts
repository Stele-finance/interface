import { RankingData } from "@/app/hooks/useRanking"

/**
 * Check if user is in top 5 ranking
 */
export const isUserInTop5 = (rankingData: RankingData | null, userAddress: string): boolean => {
  if (!rankingData || !rankingData.topUsers || !userAddress) {
    return false
  }

  // Check first 5 positions
  const top5Users = rankingData.topUsers.slice(0, 5)
  
  return top5Users.some(address => 
    address && address.toLowerCase() === userAddress.toLowerCase()
  )
}

/**
 * Get user's rank (1-based index, returns null if not found)
 */
export const getUserRank = (rankingData: RankingData | null, userAddress: string): number | null => {
  if (!rankingData || !rankingData.topUsers || !userAddress) {
    return null
  }

  const userIndex = rankingData.topUsers.findIndex(address => 
    address && address.toLowerCase() === userAddress.toLowerCase()
  )

  return userIndex >= 0 ? userIndex + 1 : null
}