"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { ProgressBar } from "./ProgressBar"
import { ProposalTableProps } from "./types"

// Proposal Table component
export function ProposalTable({
  proposals,
  onProposalClick,
  formatDate,
  t,
  isLoading = false,
  emptyMessage
}: ProposalTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-gray-400">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-600 bg-transparent overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted/80 border-b border-gray-600">
            <TableHead className="text-gray-300 pl-12 text-base font-medium min-w-[200px] whitespace-nowrap">{t('title')}</TableHead>
            <TableHead className="text-gray-300 text-center pl-6 text-base font-medium min-w-[120px] whitespace-nowrap">{t('status')}</TableHead>
            <TableHead className="text-gray-300 pl-20 text-base font-medium min-w-[150px] whitespace-nowrap">{t('progress')}</TableHead>
            <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('start')}</TableHead>
            <TableHead className="text-gray-300 pl-14 text-base font-medium min-w-[100px] whitespace-nowrap">{t('ends')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <TableRow 
                key={proposal.id} 
                className="border-0 hover:bg-gray-800/30 cursor-pointer"
                onClick={() => onProposalClick(proposal)}
              >
                <TableCell className="max-w-xs py-6 min-w-[200px] whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-100 truncate">{proposal.title}</h3>
                  </div>
                </TableCell>
                <TableCell className="text-center py-6 min-w-[120px] whitespace-nowrap">
                  <StatusBadge proposal={proposal} t={t} />
                </TableCell>
                <TableCell className="min-w-52 py-6 min-w-[150px] whitespace-nowrap">
                  <ProgressBar 
                    votesFor={proposal.votesFor} 
                    votesAgainst={proposal.votesAgainst} 
                    abstain={proposal.abstain}
                  />
                </TableCell>
                <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                  {formatDate(proposal.startTime)}
                </TableCell>
                <TableCell className="text-sm text-gray-300 py-6 min-w-[100px] whitespace-nowrap">
                  {formatDate(proposal.endTime)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 