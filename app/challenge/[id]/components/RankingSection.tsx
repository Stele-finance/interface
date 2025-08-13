import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRanking } from "@/app/hooks/useRanking"
import { useRouter } from "next/navigation"
import { formatDateWithLocale } from "@/lib/utils"

interface RankingSectionProps {
  challengeId: string
  network: 'ethereum' | 'arbitrum' | null
}

export function RankingSection({ challengeId, network }: RankingSectionProps) {
  const { t, language } = useLanguage()
  const router = useRouter();
  const { data: rankingData, isLoading: isLoadingRanking, error: rankingError } = useRanking(challengeId, network);

  const formatAddress = (address: string) => {
    // Check if address is empty or zero address
    if (!address || address === '0x0000000000000000000000000000000000000000' || address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return '';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score: string) => {
    try {
      const scoreValue = parseFloat(score);
      const truncated = Math.floor(scoreValue * 100) / 100;
      return truncated.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const formatProfitRatio = (profitRatio: string, userAddress: string) => {
    // Check if address is empty or zero address
    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return '0.0%';
    }
    
    // Convert profit ratio to percentage
    const ratioValue = parseFloat(profitRatio);
    const truncated = Math.floor(ratioValue * 10000) / 10000;
    return `${truncated.toFixed(4)}%`;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 5) {
      const emojis = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
      return <span className="text-3xl">{emojis[rank - 1]}</span>;
    } else {
      return <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    return 'bg-transparent border-transparent text-gray-100 hover:bg-gray-800/20';
  };

  const handleUserClick = (userAddress: string) => {
    // Check if address is empty or zero address
    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000' || userAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return;
    }
    router.push(`/challenge/${challengeId}/${userAddress}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl text-gray-100">{t('ranking')}</h2>
      </div>
      <Card className="bg-transparent border-transparent">
        <CardContent className="p-0">
          <div className="space-y-0">
            {isLoadingRanking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">{t('loadingRankings')}</span>
              </div>
            ) : rankingError ? (
              <div className="text-center py-8 text-red-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">{t('errorLoadingRankings')}</p>
                <p className="text-sm text-gray-500 mt-2">{rankingError.message}</p>
              </div>
            ) : rankingData && rankingData.topUsers.length > 0 ? (
              rankingData.topUsers.map((user: string, index: number) => {
                const rank = index + 1;
                const profitRatio = rankingData.profitRatios[index];
                const score = rankingData.scores[index];
                const formattedAddress = formatAddress(user);
                const isEmptySlot = !formattedAddress;

                return (
                  <div 
                    key={`${user}-${rank}`} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(rank)} ${
                      isEmptySlot ? 'cursor-default' : 'cursor-pointer transition-colors'
                    }`}
                    onClick={() => !isEmptySlot && handleUserClick(user)}
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(rank)}
                      <div>
                        <div className="font-medium text-white">
                          {isEmptySlot ? (
                            <span className="text-gray-500 italic">{t('empty')}</span>
                          ) : (
                            formattedAddress
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-white">${formatScore(score || '0')}</div>
                      <div className={`text-sm font-medium ${
                        parseFloat(profitRatio) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(profitRatio) >= 0 ? '+' : ''}{formatProfitRatio(profitRatio, user)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noRankingDataFound')}</p>
                <p className="text-sm mt-1">{t('rankingsWillAppear')}</p>
              </div>
            )}
          </div>
          {rankingData && (
            <div className="pb-10 md:pb-6">
              <div className="text-xs text-gray-500 text-center">
                {t('lastUpdated')}: {formatDateWithLocale(new Date(parseInt(rankingData.updatedAtTimestamp) * 1000), language)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 