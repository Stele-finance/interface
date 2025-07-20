"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, BarChart3 } from "lucide-react"
import { ProposalStatsProps } from "./types"
import { 
  formatVoteCount, 
  calculateVotePercentages, 
  getStatusBadgeInfo,
  formatTimeRemaining 
} from "../utils"

// Proposal Stats component
export function ProposalStats({ proposalData, voteResultData, currentState, t }: ProposalStatsProps) {
  // Get vote counts
  const forVotes = voteResultData?.forVotes || proposalData?.votesFor || "0"
  const againstVotes = voteResultData?.againstVotes || proposalData?.votesAgainst || "0"
  const abstainVotes = voteResultData?.abstainVotes || proposalData?.abstain || "0"

  // Format vote counts
  const formattedForVotes = formatVoteCount(forVotes)
  const formattedAgainstVotes = formatVoteCount(againstVotes)
  const formattedAbstainVotes = formatVoteCount(abstainVotes)

  // Calculate percentages
  const { forPercent, againstPercent, abstainPercent } = calculateVotePercentages(
    forVotes, 
    againstVotes, 
    abstainVotes
  )

  // Calculate total votes
  const totalVotes = Number(formattedForVotes) + Number(formattedAgainstVotes) + Number(formattedAbstainVotes)

  // Get status info
  const statusInfo = getStatusBadgeInfo(currentState)

  // Calculate time remaining
  const endTime = proposalData ? new Date(proposalData.endTime) : null
  const timeRemaining = endTime ? formatTimeRemaining(endTime) : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Voting Results Card */}
      <Card className="bg-muted/50 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-100">
            <BarChart3 className="mr-2 h-5 w-5" />
            {t('votingResults')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('status')}:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Total Votes */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('totalVotes')}:</span>
            <span className="font-semibold text-gray-100">
              {totalVotes.toLocaleString()} STELE
            </span>
          </div>

          {/* Vote Breakdown */}
          <div className="space-y-3">
            {/* For votes */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-green-400 font-medium">{t('for')}</span>
                <span className="text-gray-300">
                  {Number(formattedForVotes).toLocaleString()} ({forPercent}%)
                </span>
              </div>
              <Progress 
                value={forPercent} 
                className="h-2 bg-gray-700"
                style={{ '--progress-foreground': 'rgb(34 197 94)' } as any}
              />
            </div>

            {/* Against votes */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-red-400 font-medium">{t('against')}</span>
                <span className="text-gray-300">
                  {Number(formattedAgainstVotes).toLocaleString()} ({againstPercent}%)
                </span>
              </div>
              <Progress 
                value={againstPercent} 
                className="h-2 bg-gray-700"
                style={{ '--progress-foreground': 'rgb(239 68 68)' } as any}
              />
            </div>

            {/* Abstain votes */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 font-medium">{t('abstain')}</span>
                <span className="text-gray-300">
                  {Number(formattedAbstainVotes).toLocaleString()} ({abstainPercent}%)
                </span>
              </div>
              <Progress 
                value={abstainPercent} 
                className="h-2 bg-gray-700"
                style={{ '--progress-foreground': 'rgb(156 163 175)' } as any}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Info Card */}
      <Card className="bg-muted/50 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-100">
            <Users className="mr-2 h-5 w-5" />
            {t('proposalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proposal ID */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('proposalId')}:</span>
            <span className="font-mono text-gray-100">
              #{proposalData?.blockNumber || 'Loading...'}
            </span>
          </div>

          {/* Voting Period */}
          {proposalData && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('votingStarts')}:</span>
                <span className="text-gray-100">
                  {new Date(proposalData.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('votingEnds')}:</span>
                <span className="text-gray-100">
                  {new Date(proposalData.endTime).toLocaleDateString()}
                </span>
              </div>
            </>
          )}

          {/* Time Remaining */}
          {timeRemaining && timeRemaining !== 'Ended' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {t('timeRemaining')}:
              </span>
              <span className="text-orange-400 font-medium">
                {timeRemaining}
              </span>
            </div>
          )}

          {/* Participation Rate */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('participation')}:</span>
            <span className="text-gray-100">
              {/* This would need total supply data to calculate properly */}
              {totalVotes > 0 ? `${totalVotes.toLocaleString()} STELE` : t('noVotesYet')}
            </span>
          </div>

          {/* Quorum Status (if applicable) */}
          {totalVotes > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('quorum')}:</span>
              <span className="text-green-400">
                {t('met')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 