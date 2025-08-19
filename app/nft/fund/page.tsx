"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ImageIcon, PieChart } from "lucide-react"

export default function NFTFundPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-16 w-16 text-blue-500" />
          <PieChart className="h-12 w-12 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold">Fund NFTs</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Fund NFT page is under development. Please check back later.
        </p>
        <Button 
          onClick={() => router.push('/nft/challenge')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          View Challenge NFTs
        </Button>
      </div>
    </div>
  )
}