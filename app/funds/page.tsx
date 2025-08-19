"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { PieChart } from "lucide-react"

export default function FundsPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <PieChart className="h-16 w-16 text-blue-500" />
        <h1 className="text-3xl font-bold">Funds</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Funds page is under development. Please check back later.
        </p>
        <Button 
          onClick={() => router.push('/dashboard/fund')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Go to Fund Dashboard
        </Button>
      </div>
    </div>
  )
}