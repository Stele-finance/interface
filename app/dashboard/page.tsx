'use client'

import { DashboardClientComponents } from "./components/DashboardClientComponents"
import { DashboardCharts } from "./components/DashboardCharts"
import { useWallet } from "@/app/hooks/useWallet"

export default function Dashboard() {
  const { network } = useWallet()

  return (
    <div className="w-full mx-auto px-3 py-0 sm:px-6 sm:py-2 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-4">
        <DashboardCharts network={network} />
        <div className="mt-4 sm:mt-6">
          <DashboardClientComponents network={network} />
        </div>
      </div>
    </div>
  )
} 