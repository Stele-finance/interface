"use client"

import { ProgressBarProps } from "./types"

// Progress bar component
export function ProgressBar({ votesFor, votesAgainst, abstain }: ProgressBarProps) {
  const total = votesFor + votesAgainst + abstain
  
  // Avoid division by zero
  if (total === 0) {
    return (
      <div className="w-48 mt-2">
        <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden"></div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-600">0%</span>
          <span className="text-red-600">0%</span>
          <span className="text-gray-500">0%</span>
        </div>
      </div>
    )
  }
  
  const forPercentage = (votesFor / total) * 100
  const againstPercentage = (votesAgainst / total) * 100
  const abstainPercentage = (abstain / total) * 100

  return (
    <div className="w-48 mt-2">
      <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="bg-green-500" style={{ width: `${forPercentage}%` }}></div>
        <div className="bg-red-500" style={{ width: `${againstPercentage}%` }}></div>
        <div className="bg-gray-400" style={{ width: `${abstainPercentage}%` }}></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-green-600">{Math.round(forPercentage)}%</span>
        <span className="text-red-600">{Math.round(againstPercentage)}%</span>
        <span className="text-gray-500">{Math.round(abstainPercentage)}%</span>
      </div>
    </div>
  )
} 