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

export default function FundProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { setPageType } = usePageType()
  
  useEffect(() => {
    setPageType('fund')
  }, [setPageType])
  
  return <ProposalDetailPage params={params} />
}