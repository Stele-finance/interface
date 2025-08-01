"use client"

import React from "react"
import { Clock, CheckCircle, XCircle, Loader2, Calendar, AlertCircle } from "lucide-react"
import { StatusBadgeProps } from "./types"

// Status badge component with real-time status calculation
export function StatusBadge({ proposal, t }: StatusBadgeProps) {
  // Calculate real-time status based on current time and vote results
  const now = Date.now()
  const startTime = proposal.startTime.getTime()
  const endTime = proposal.endTime.getTime()
  const votesFor = proposal.votesFor
  const votesAgainst = proposal.votesAgainst
  
  let realTimeStatus: string
  let statusColor: string
  let statusIcon: React.ReactElement
  let statusText: string
  
  // For final states (EXECUTED, CANCELED, QUEUED), trust the stored status
  if (proposal.status === 'executed') {
    realTimeStatus = 'EXECUTED'
    statusColor = 'bg-purple-600 text-white'
    statusIcon = <CheckCircle className="w-3 h-3" />
    statusText = t('executed')
  } else if (proposal.status === 'canceled') {
    realTimeStatus = 'CANCELED'
    statusColor = 'bg-gray-600 text-white'
    statusIcon = <XCircle className="w-3 h-3" />
    statusText = t('canceled')
  } else if (proposal.status === 'queued') {
    realTimeStatus = 'QUEUED'
    statusColor = 'bg-blue-600 text-white'
    statusIcon = <Loader2 className="w-3 h-3" />
    statusText = t('queued')
  } else {
    // Calculate status based on time and vote results
    if (now < startTime) {
      // Voting hasn't started yet
      realTimeStatus = 'PENDING'
      statusColor = 'bg-yellow-600 text-white'
      statusIcon = <Calendar className="w-3 h-3" />
      statusText = t('pending')
    } else if (now >= startTime && now <= endTime) {
      // Currently in voting period
      realTimeStatus = 'ACTIVE'
      statusColor = 'bg-green-600 text-white'
      statusIcon = <Clock className="w-3 h-3" />
      statusText = t('voting')
    } else {
      // Voting period has ended - check vote results
      const totalDecisiveVotes = votesFor + votesAgainst
      
      if (totalDecisiveVotes === 0) {
        // No votes cast - consider defeated
        realTimeStatus = 'DEFEATED'
        statusColor = 'bg-red-600 text-white'
        statusIcon = <XCircle className="w-3 h-3" />
        statusText = t('defeated')
      } else if (votesFor > votesAgainst) {
        // More votes for than against - passed, pending queue
        realTimeStatus = 'PENDING_QUEUE'
        statusColor = 'bg-orange-600 text-white'
        statusIcon = <Loader2 className="w-3 h-3" />
        statusText = 'Pending Queue'
      } else {
        // More votes against or tied - defeated
        realTimeStatus = 'DEFEATED'
        statusColor = 'bg-red-600 text-white'
        statusIcon = <XCircle className="w-3 h-3" />
        statusText = t('defeated')
      }
    }
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}>
      {statusIcon}
      <span>{statusText}</span>
    </div>
  )
} 