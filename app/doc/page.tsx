"use client"

// Force dynamic rendering to avoid SSR issues with wallet hooks
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  Wallet,
  ArrowRightLeft,
  UserPlus,
  Gift,
  Vote,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Responsive image component for documentation
const ResponsiveDocImage = ({ imageName, alt, caption }: { imageName: string, alt: string, caption: string }) => {
  // Images to display at larger size
  const largeImages = ['swap1.png', 'create1.png', 'create3.png', 'join1.png', 'join2.png', 'join4.png', 'vote2.png', 'vote3.png', 'vote4.png', 'vote5.png', 'vote6.png', 'vote7.png', 'getrewards1.png', 'getrewards2.png', 'getrewards3.png', 'getrewards4.png', 'getrewards5.png', 'register1.png', 'register2.png', 'register3.png', 'register4.png', 'register5.png']
  const isLargeImage = largeImages.includes(imageName)
  const pcMaxWidth = isLargeImage ? '800px' : '600px'
  const mobileMaxWidth = isLargeImage ? '500px' : '400px'

  return (
    <div className="ml-10">
      <div className="inline-block">
        {/* PC image - displayed on md and above */}
        <Image
          src={`/doc/pc/${imageName}`}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className="hidden md:block w-auto h-auto max-w-full rounded-xl shadow-lg border border-border/30"
          style={{ maxWidth: pcMaxWidth }}
        />
        {/* Mobile image - displayed below md */}
        <Image
          src={`/doc/mobile/${imageName}`}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className="block md:hidden w-auto h-auto max-w-full rounded-xl shadow-lg border border-border/30"
          style={{ maxWidth: mobileMaxWidth }}
        />
        <p className="text-xs text-center text-muted-foreground mt-2">{caption}</p>
      </div>
    </div>
  )
}

export default function DocPage() {
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState("overview")

  const features = [
    {
      id: "create-fund",
      icon: Trophy,
      title: "Create Fund",
      description: "Create new investment fund"
    },
    {
      id: "join-fund",
      icon: UserPlus,
      title: "Join Fund",
      description: "Join existing fund"
    },
    {
      id: "deposit",
      icon: Wallet,
      title: "Deposit",
      description: "Deposit funds"
    },
    {
      id: "withdraw",
      icon: Wallet,
      title: "Withdraw",
      description: "Withdraw funds"
    },
    {
      id: "swap",
      icon: ArrowRightLeft,
      title: "Token Swap",
      description: "Exchange tokens"
    },
    {
      id: "get-fee",
      icon: Gift,
      title: "Get Fee",
      description: "Claim manager fees"
    },
    {
      id: "mint-nft",
      icon: Vote,
      title: "Mint NFT",
      description: "Mint fund NFT"
    }
  ]

  const sidebarItems = [
    { id: "overview", title: "Overview", icon: Info },
    { id: "create-fund", title: "Create Fund", icon: Trophy },
    { id: "join-fund", title: "Join Fund", icon: UserPlus },
    { id: "deposit", title: "Deposit", icon: Wallet },
    { id: "withdraw", title: "Withdraw", icon: Wallet },
    { id: "swap", title: "Token Swap", icon: ArrowRightLeft },
    { id: "get-fee", title: "Get Fee", icon: Gift },
    { id: "mint-nft", title: "Mint NFT", icon: Vote },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-muted/10 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
            Stele Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete guide for the decentralized Crypto Fund platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-muted/40 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors rounded-none border-l-4",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Empty main content area */}
          </div>
        </div>
      </div>
    </div>
  )
}
