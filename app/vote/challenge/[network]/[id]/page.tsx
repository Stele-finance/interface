'use client'

import dynamic from "next/dynamic"
import { useEffect } from "react"
import { usePageType } from "@/lib/page-type-context"

const ProposalDetailPage = dynamic(
  () => import("../../../[network]/[id]/page"),
  { ssr: false }
)

interface ProposalDetailPageProps {
  params: Promise<{
    network: string
    id: string
  }>
}

export default function ChallengeProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { setPageType } = usePageType()
  
  useEffect(() => {
    setPageType('challenge')
  }, [setPageType])
  
  return <ProposalDetailPage params={params} />
}