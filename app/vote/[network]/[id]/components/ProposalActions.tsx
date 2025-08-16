"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Play, Clock, X, Settings } from "lucide-react"
import { AdminActionsProps } from "./types"
import { canQueueProposal, canExecuteProposal, canCancelProposal } from "../utils"

// Proposal Actions component (Admin Actions)
export function ProposalActions({
  id,
  currentState,
  isQueuing,
  isExecuting,
  isCanceling,
  handleQueue,
  handleExecute,
  handleCancel,
  t
}: AdminActionsProps) {
  const canQueue = canQueueProposal(currentState)
  const canExecute = canExecuteProposal(currentState)
  const canCancel = canCancelProposal(currentState)

  // If no actions are available, don't render the component
  if (!canQueue && !canExecute && !canCancel) {
    return null
  }

  return (
    <Card className="mb-6 bg-muted/50 border-gray-600">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-100">
          <Settings className="mr-2 h-5 w-5" />
          {t('proposalActions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-400 mb-4">
          {t('adminActionsDescription')}
        </div>

        {/* Queue Action */}
        {canQueue && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-100">{t('queueProposal')}</h4>
                  <p className="text-sm text-gray-400">{t('queueProposalDescription')}</p>
                </div>
                <Button
                  onClick={handleQueue}
                  disabled={isQueuing}
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                >
                  {isQueuing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('queuing')}
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      {t('queue')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Separator className="bg-gray-600" />
          </>
        )}

        {/* Execute Action */}
        {canExecute && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-100">{t('executeProposal')}</h4>
                  <p className="text-sm text-gray-400">{t('executeProposalDescription')}</p>
                </div>
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('executing')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('execute')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Separator className="bg-gray-600" />
          </>
        )}

        {/* Cancel Action */}
        {canCancel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-100">{t('cancelProposal')}</h4>
                <p className="text-sm text-gray-400">{t('cancelProposalDescription')}</p>
              </div>
              <Button
                onClick={handleCancel}
                disabled={isCanceling}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('canceling')}
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    {t('cancel')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Warning message */}
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 mt-4">
          <p className="text-amber-400 text-sm">
            <strong>{t('warning')}:</strong> {t('proposalActionsWarning')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 