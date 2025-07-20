"use client"

import Link from "next/link"
import { ArrowLeft, User, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProposalHeaderProps } from "./types"
import { parseProposalDescription, formatDate } from "../utils"

// Proposal Header component
export function ProposalHeader({ id, proposalData, t }: ProposalHeaderProps) {
  // Parse title and description
  const { title, description } = proposalData 
    ? parseProposalDescription(proposalData.description)
    : { title: `Proposal #${id}`, description: "Loading proposal details..." }

  // Parse timestamps
  const startTime = proposalData ? new Date(proposalData.startTime) : null
  const endTime = proposalData ? new Date(proposalData.endTime) : null

  return (
    <div className="mb-6">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/vote">
          <Button variant="ghost" className="text-gray-400 hover:text-gray-100 p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToProposals')}
          </Button>
        </Link>
      </div>

      {/* Proposal header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              <span>{t('proposer')}: </span>
              <span className="font-mono ml-1">
                {proposalData?.proposer || 'Loading...'}
              </span>
            </div>
            {startTime && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{t('starts')}: </span>
                <span className="ml-1">{formatDate(startTime)}</span>
              </div>
            )}
            {endTime && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{t('ends')}: </span>
                <span className="ml-1">{formatDate(endTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 border border-gray-600 rounded-lg p-4">
          <div className="flex items-start mb-2">
            <FileText className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
            <h3 className="text-lg font-semibold text-gray-100">{t('description')}</h3>
          </div>
          <div className="text-gray-300 whitespace-pre-wrap break-words">
            {description}
          </div>
        </div>
      </div>
    </div>
  )
} 