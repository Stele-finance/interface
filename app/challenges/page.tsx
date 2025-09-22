"use client"

import dynamicImport from "next/dynamic"

// Force dynamic rendering to avoid SSR issues with wallet hooks
export const dynamic = 'force-dynamic'

const ChallengesClientComponents = dynamicImport(
  () => import("./components/ChallengesClientComponents").then(mod => ({ default: mod.ChallengesClientComponents })),
  { ssr: false }
)

export default function ChallengesPage() {
  return (
    <div className="container mx-auto p-6 py-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <ChallengesClientComponents />
      </div>
    </div>
  )
}