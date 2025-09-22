'use client'

import dynamic from "next/dynamic"
import { useEffect } from "react"
import { usePageType } from "@/lib/page-type-context"

const VotePage = dynamic(
  () => import("../page"),
  { ssr: false }
)

export default function VoteChallengePage() {
  const { setPageType } = usePageType()
  
  useEffect(() => {
    setPageType('challenge')
  }, [setPageType])
  
  return <VotePage />
}