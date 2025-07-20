"use client"

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
  let statusIcon: string
  let statusText: string
  
  // For final states (EXECUTED, CANCELED, QUEUED), trust the stored status
  if (proposal.status === 'executed') {
    realTimeStatus = 'EXECUTED'
    statusColor = 'bg-green-100 text-green-800'
    statusIcon = '✨'
    statusText = t('executed')
  } else if (proposal.status === 'canceled') {
    realTimeStatus = 'CANCELED'
    statusColor = 'bg-gray-100 text-gray-800'
    statusIcon = '🚫'
    statusText = t('canceled')
  } else if (proposal.status === 'queued') {
    realTimeStatus = 'QUEUED'
    statusColor = 'bg-blue-100 text-blue-800'
    statusIcon = '🔄'
    statusText = t('queued')
  } else {
    // Calculate status based on time and vote results
    if (now < startTime) {
      // Voting hasn't started yet
      realTimeStatus = 'PENDING'
      statusColor = 'bg-yellow-100 text-yellow-800'
      statusIcon = '⏳'
      statusText = t('pending')
    } else if (now >= startTime && now <= endTime) {
      // Currently in voting period
      realTimeStatus = 'ACTIVE'
      statusColor = 'bg-green-100 text-green-800'
      statusIcon = '🗳️'
      statusText = t('voting')
    } else {
      // Voting period has ended - check vote results
      const totalDecisiveVotes = votesFor + votesAgainst
      
      if (totalDecisiveVotes === 0) {
        // No votes cast - consider defeated
        realTimeStatus = 'DEFEATED'
        statusColor = 'bg-red-100 text-red-800'
        statusIcon = '❌'
        statusText = t('defeated')
      } else if (votesFor > votesAgainst) {
        // More votes for than against - passed, pending queue
        realTimeStatus = 'PENDING_QUEUE'
        statusColor = 'bg-orange-100 text-orange-800'
        statusIcon = '⏳'
        statusText = 'Pending Queue'
      } else {
        // More votes against or tied - defeated
        realTimeStatus = 'DEFEATED'
        statusColor = 'bg-red-100 text-red-800'
        statusIcon = '❌'
        statusText = t('defeated')
      }
    }
  }
  
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}>
      {statusIcon} {statusText}
    </div>
  )
} 