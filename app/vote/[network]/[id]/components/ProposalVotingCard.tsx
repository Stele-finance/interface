"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Vote as VoteIcon, CheckCircle } from "lucide-react"
import { ProposalVotingCardProps } from "./types"
import { formatVotingPower } from "../utils"

// Proposal Voting Card component
export function ProposalVotingCard({
  id,
  voteOption,
  setVoteOption,
  reason,
  setReason,
  isVoting,
  hasVoted,
  votingPower,
  walletConnected,
  handleVote,
  t
}: ProposalVotingCardProps) {
  const formattedVotingPower = formatVotingPower(votingPower)

  return (
    <Card className="mb-6 bg-muted/50 border-gray-600">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-100">
          <VoteIcon className="mr-2 h-5 w-5" />
          {t('castYourVote')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet connection status */}
        {!walletConnected ? (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">{t('connectWalletToVote')}</p>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
              <span className="text-green-400 font-semibold">{t('voteAlreadyCast')}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('youHaveAlreadyVoted')}</p>
          </div>
        ) : Number(formattedVotingPower) === 0 ? (
          <div className="text-center py-4">
            <p className="text-orange-400 mb-2">{t('noVotingPower')}</p>
            <p className="text-gray-400 text-sm">{t('delegateTokensToVote')}</p>
          </div>
        ) : (
          <>
            {/* Voting power display */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('yourVotingPower')}:</span>
                <span className="font-semibold text-gray-100">
                  {Number(formattedVotingPower).toLocaleString()} STELE
                </span>
              </div>
            </div>

            {/* Vote options */}
            <div>
              <Label className="text-gray-300 mb-3 block">{t('selectVoteOption')}</Label>
              <RadioGroup
                value={voteOption || ""}
                onValueChange={(value) => setVoteOption(value as any)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 border border-gray-600 rounded-lg hover:bg-gray-800/30">
                  <RadioGroupItem value="for" id="for" className="text-green-400" />
                  <Label htmlFor="for" className="flex-1 cursor-pointer text-gray-300">
                    <span className="font-semibold text-green-400">{t('for')}</span>
                    <span className="text-gray-400 text-sm block">{t('supportProposal')}</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-600 rounded-lg hover:bg-gray-800/30">
                  <RadioGroupItem value="against" id="against" className="text-red-400" />
                  <Label htmlFor="against" className="flex-1 cursor-pointer text-gray-300">
                    <span className="font-semibold text-red-400">{t('against')}</span>
                    <span className="text-gray-400 text-sm block">{t('opposeProposal')}</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-600 rounded-lg hover:bg-gray-800/30">
                  <RadioGroupItem value="abstain" id="abstain" className="text-gray-400" />
                  <Label htmlFor="abstain" className="flex-1 cursor-pointer text-gray-300">
                    <span className="font-semibold text-gray-400">{t('abstain')}</span>
                    <span className="text-gray-400 text-sm block">{t('neutralPosition')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Reason (optional) */}
            <div>
              <Label htmlFor="reason" className="text-gray-300 mb-2 block">
                {t('reason')} <span className="text-gray-500">({t('optional')})</span>
              </Label>
              <Textarea
                id="reason"
                placeholder={t('explainYourVote')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-gray-100 placeholder-gray-500"
                rows={3}
              />
            </div>

            {/* Vote button */}
            <Button
              onClick={handleVote}
              disabled={!voteOption || isVoting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:text-gray-400"
              size="lg"
            >
              {isVoting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submittingVote')}
                </>
              ) : (
                <>
                  <VoteIcon className="mr-2 h-4 w-4" />
                  {t('castVote')}
                </>
              )}
            </Button>

            {/* Vote option preview */}
            {voteOption && (
              <div className="text-center text-sm text-gray-400">
                {t('youAreVoting')} <span className="font-semibold text-gray-200">{t(voteOption)}</span> {t('with')} <span className="font-semibold text-gray-200">{Number(formattedVotingPower).toLocaleString()} STELE</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 