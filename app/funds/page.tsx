"use client"

import dynamicImport from "next/dynamic"

// Force dynamic rendering to avoid SSR issues with wallet hooks
export const dynamic = 'force-dynamic'

const FundsClientComponents = dynamicImport(
  () => import("./components/FundsClientComponents").then(mod => ({ default: mod.FundsClientComponents })),
  { ssr: false }
)

export default function FundsPage() {
  return (
    <div className="container mx-auto p-6 py-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <FundsClientComponents />
      </div>
    </div>
  )
}