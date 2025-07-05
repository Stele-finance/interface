'use client'

import { DashboardClientComponents } from "@/components/DashboardClientComponents"
import { DashboardCharts } from "@/components/dashboard-charts"
import { useWallet } from "@/app/hooks/useWallet"

export default function Dashboard() {
  const { network } = useWallet()

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
        </div>
        <DashboardCharts network={network} />
        <div className="mt-6">
          <DashboardClientComponents network={network} />
        </div>
      </div>
    </div>
  )
} 