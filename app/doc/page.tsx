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
  const largeImages = ['swap1.png', 'create1.png', 'create3.png', 'join1.png', 'join2.png', 'join4.png', 'vote2.png', 'vote3.png', 'vote4.png', 'vote5.png', 'vote6.png', 'vote7.png', 'getrewards1.png', 'getrewards2.png', 'getrewards3.png', 'getrewards4.png', 'getrewards5.png', 'getrewards6.png', 'register1.png', 'register2.png', 'register3.png', 'register4.png', 'register5.png']
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
      id: "create-challenge",
      icon: Trophy,
      title: "Create Challenge",
      description: "Create new investment challenges and compete with other users"
    },
    {
      id: "join-challenge",
      icon: UserPlus,
      title: "Join Challenge",
      description: "Join existing challenges and test your investment skills"
    },
    {
      id: "swap",
      icon: ArrowRightLeft,
      title: "Token Swap",
      description: "Exchange various tokens within challenges to build your portfolio"
    },
    {
      id: "register",
      icon: Wallet,
      title: "Register Performance",
      description: "Register your investment performance on blockchain after challenge ends"
    },
    {
      id: "rewards",
      icon: Gift,
      title: "Claim Rewards",
      description: "Claim rewards for excellent performance"
    },
    {
      id: "vote",
      icon: Vote,
      title: "Governance Voting",
      description: "Participate in platform governance and contribute to protocol improvements"
    }
  ]

  const sidebarItems = [
    { id: "overview", title: "Overview", icon: Info },
    { id: "create-challenge", title: "Create Challenge", icon: Trophy },
    { id: "join-challenge", title: "Join Challenge", icon: UserPlus },
    { id: "swap", title: "Token Swap", icon: ArrowRightLeft },
    { id: "register", title: "Register Performance", icon: Wallet },
    { id: "rewards", title: "Claim Rewards", icon: Gift },
    { id: "vote", title: "Governance Voting", icon: Vote },
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
            Complete guide for the decentralized investment challenge platform.
          </p>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn all features from challenge creation to governance participation.
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
                          {activeSection === "overview" && (
                <div className="space-y-8">
                  <Card className="bg-muted/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Info className="h-6 w-6" />
                      Platform Overview
                    </CardTitle>
                    <CardDescription>
                      Stele is a decentralized investment challenge platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <p>
                        Stele is a decentralized platform where users can test and compete 
                        with their cryptocurrency investment strategies.
                      </p>
                      <p>
                        All participants are given the same virtual seed money, 
                        and can earn rewards by achieving the highest returns in time-limited challenges.
                      </p>
                      <br />
                      <h3>Key Features</h3>
                      <ul>
                        <li><strong>1. Virtual Seed Money:</strong> Equal virtual seed money provided to all participants</li>
                        <li><strong>2. Time-Limited Challenges:</strong> Compete to achieve the highest returns within set periods</li>
                        <li><strong>3. Decentralized Governance:</strong> Community voting on platform improvements</li>
                        <li><strong>4. Transparent Rankings:</strong> Transparent performance tracking recorded on blockchain</li>
                        <li><strong>5. Multi-Network:</strong> Supports Ethereum and Arbitrum</li>
                      </ul>
                      <br />
                      <h3>Supported Networks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                        <Card className="bg-muted/30 border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <Image
                                  src="/networks/ethereum.png"
                                  alt="Ethereum"
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                  style={{ width: "auto", height: "auto" }}
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold">Ethereum Mainnet</h4>
                                <p className="text-sm text-muted-foreground">Main Network</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <Image
                                  src="/networks/arbitrum.png"
                                  alt="Arbitrum"
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                  style={{ width: "auto", height: "auto" }}
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold">Arbitrum One</h4>
                                <p className="text-sm text-muted-foreground">Low Fees</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <Card 
                        key={feature.id} 
                        className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-muted/30 border-border/50"
                        onClick={() => setActiveSection(feature.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Feature Detail Sections */}
            {activeSection !== "overview" && (
              <div className="space-y-6">
                {(() => {
                  const feature = features.find(f => f.id === activeSection)
                  const Icon = feature?.icon || Info
                    return (
                      <>
                        <Card className="bg-muted/40 border-border/50">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">{feature?.title}</CardTitle>
                              <CardDescription>{feature?.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* How it works */}
                            <div>
                              <h3 className="text-lg font-semibold mb-3">How it Works</h3>
                              <div className="prose dark:prose-invert max-w-none">
                                {activeSection === "create-challenge" && (
                                  <div className="space-y-6">
                                    <p>Challenge creation is the process of starting a new investment competition:</p>
                                    
                                                                        {/* Create Challenge Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Click &quot;Create Challenge&quot; button on dashboard</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="create1.png" 
                                            alt="Dashboard - Create Challenge Button"
                                        caption="Create Challenge button on dashboard" 
                                      />
                                    </div>

                                    {/* Create Challenge Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Select challenge type (1 week, 1 month, 3 month, 6 month, 1 year)</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="create2.png" 
                                            alt="Challenge Type Selection Modal"
                                        caption="Challenge type selection modal" 
                                      />
                                    </div>

                                    {/* Create Challenge Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Connect wallet and approve transaction</p>
                                      </div>
                                    </div>

                                    {/* Create Challenge Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Check created challenge page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="create3.png" 
                                        alt="Check Created Challenge Page" 
                                        caption="Check created challenge page" 
                                      />
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Note</h4>
                                          <p className="text-green-600 dark:text-green-400">Challenge creation requires gas fees, and other users can participate after creation.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeSection === "join-challenge" && (
                                  <div className="space-y-6">
                                    <p>You can participate in existing challenges to test your investment skills:</p>
                                    
                                                                        {/* Join Challenge Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Select the challenge you want to join</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="join1.png" 
                                            alt="Challenge Page"
                                        caption="Select challenge from dashboard page" 
                                      />

                                    </div>

                                    {/* Join Challenge Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Click join button on challenge page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="join2.png" 
                                        alt="Click Join Button on Challenge Page" 
                                        caption="Click join button on challenge page" 
                                      />
                                    </div>

                                    {/* Join Challenge Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Confirm entry fee</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="join3.png" 
                                        alt="Entry Fee Approval Screen" 
                                        caption="Entry fee approval screen" 
                                      />
                                    </div>

                                    {/* Join Challenge Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Approve entry fee in wallet</p>
                                      </div>
                                        </div>

                                    {/* Join Challenge Step 5 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">5</div>
                                        <p className="font-medium">Confirm investor page creation</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="join4.png" 
                                        alt="Start Investing with Virtual Seed Money" 
                                        caption="Start investing with virtual seed money" 
                                      />
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Virtual Seed Money</h4>
                                          <p className="text-green-600 dark:text-green-400">All participants start with the same virtual seed money (e.g., 1000 USDC) and no initial investment is required.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeSection === "swap" && (
                                  <div className="space-y-6">
                                    <p>During challenges, you can exchange various tokens to modify your portfolio:</p>
                                    
                                                                        {/* Token Swap Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Click Swap button on portfolio page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="swap1.png" 
                                            alt="Click Swap Button"
                                        caption="Click swap button" 
                                      />
                                    </div>

                                    {/* Token Swap Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Select tokens and enter amount</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="swap2.png" 
                                            alt="Select Tokens and Enter Amount"
                                        caption="Select tokens and enter amount" 
                                      />
                                    </div>

                                    {/* Token Swap Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Check expected exchange rate</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="swap3.png" 
                                            alt="Check Expected Exchange Rate"
                                        caption="Check expected exchange rate" 
                                      />
                                    </div>

                                    {/* Token Swap Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Execute transaction</p>
                                      </div>
                                    </div>

                                    {/* Token Swap Step 5 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">5</div>
                                        <p className="font-medium">Confirm swap tokens and transaction</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="swap4.png" 
                                        alt="Confirm Swap Tokens" 
                                        caption="Confirm swap tokens" 
                                      />
                                      <ResponsiveDocImage 
                                        imageName="swap5.png" 
                                        alt="Confirm Transaction" 
                                        caption="Confirm transaction" 
                                      />
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Tip</h4>
                                          <p className="text-green-600 dark:text-green-400">Monitor real-time price movements and execute swaps at optimal timing.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeSection === "register" && (
                                  <div className="space-y-6">
                                    <p>This is an important step to register your performance on the blockchain after the challenge ends:</p>
                                    
                                    {/* Performance Registration Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Click &quot;Register&quot; on portfolio page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="register1.png" 
                                        alt="Click Register on Portfolio Page" 
                                        caption="Click register on portfolio page" 
                                      />
                                    </div>

                                    {/* Performance Registration Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Registration in progress</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="register2.png" 
                                        alt="Registration in Progress" 
                                        caption="Registration in progress" 
                                      />
                                    </div>

                                    {/* Performance Registration Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Registration status change</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="register3.png" 
                                        alt="Status Change" 
                                        caption="Confirm status change" 
                                      />
                                    </div>

                                    {/* Performance Registration Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Transaction confirmation</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="register4.png" 
                                        alt="Registration Confirmation" 
                                        caption="Registration confirmation" 
                                      />
                                      <ResponsiveDocImage 
                                        imageName="register5.png" 
                                        alt="Transaction Confirmation" 
                                        caption="Transaction confirmation" 
                                      />
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Important</h4>
                                          <p className="text-green-600 dark:text-green-400">If you don&apos;t register your performance, it won&apos;t be reflected in rankings and you won&apos;t be able to receive rewards.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeSection === "rewards" && (
                                  <div className="space-y-6">
                                    <p>Participants who achieve excellent performance (1st ~ 5th place) can receive rewards:</p>
                                    
                                    {/* Rewards Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Check pending status when challenge ends</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards1.png" 
                                        alt="Check Pending Status When Challenge Ends" 
                                        caption="Check pending status when challenge ends" 
                                      />
                                    </div>

                                    {/* Rewards Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Check reward recipients</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards2.png" 
                                        alt="Check Rankings" 
                                        caption="Check rankings" 
                                      />
                                    </div>

                                    {/* Rewards Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Click &quot;Claim Rewards&quot; button</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards3.png" 
                                        alt="Click Claim Rewards Button" 
                                        caption="Click claim rewards button" 
                                      />
                                    </div>

                                    {/* Rewards Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Confirm &quot;Claim Rewards&quot;</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards4.png" 
                                        alt="Confirm Claim Rewards" 
                                        caption="Confirm claim rewards" 
                                      />
                                    </div>

                                    {/* Rewards Step 5 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">5</div>
                                        <p className="font-medium">Challenge status changes to end</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards5.png" 
                                        alt="Confirm Status Changed to End" 
                                        caption="Confirm status changed to end" 
                                      />
                                    </div>

                                    {/* Rewards Step 6 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">6</div>
                                        <p className="font-medium">Transaction confirmation</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="getrewards6.png" 
                                        alt="Transaction Confirmation" 
                                        caption="Transaction confirmation" 
                                      />
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <Gift className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Reward Structure</h4>
                                          <p className="text-green-600 dark:text-green-400">The prize pool composed of entry fees is distributed to top participants, and additional STL token bonuses are also awarded.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeSection === "vote" && (
                                  <div className="space-y-6">
                                    <p>You can participate in platform governance to decide the future:</p>
                                    
                                    {/* Governance Step 1 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <p className="font-medium">Delegate STL tokens on Vote  page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote1.png" 
                                        alt="Delegate to self" 
                                        caption="Delegate to self" 
                                      />
                                    </div>

                                    {/* Governance Step 2 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <p className="font-medium">Click Create button on Vote page</p>
                                      </div>
                                    </div>

                                    {/* Governance Step 3 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <p className="font-medium">Write proposal title and descriptions</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote2.png" 
                                        alt="Create proposal page" 
                                        caption="Create proposal page" 
                                      />
                                    </div>

                                    {/* Governance Step 4 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <p className="font-medium">Set proposal type details and click Create button</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote3.png" 
                                        alt="Create proposal page" 
                                        caption="Create proposal page" 
                                      />
                                    </div>

                                    {/* Governance Step 5 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">5</div>
                                        <p className="font-medium">Execute transaction</p>
                                      </div>
                                    </div>

                                    {/* Governance Step 6 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">6</div>
                                        <p className="font-medium">Click proposal on Vote page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote4.png" 
                                        alt="Proposal table on Vote Page" 
                                        caption="Proposal table on Vote page" 
                                      />
                                    </div>

                                    {/* Governance Step 7 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">7</div>
                                        <p className="font-medium">Check proposal on Proposal page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote5.png" 
                                        alt="Proposal details page" 
                                        caption="Proposal details page" 
                                      />
                                    </div>

                                    {/* Governance Step 8 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">8</div>
                                        <p className="font-medium">Select For/Against/Abstain and click Submit Vote button</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote6.png" 
                                        alt="Proposal details page" 
                                        caption="Proposal details page" 
                                      />
                                    </div>

                                    {/* Governance Step 9 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">9</div>
                                        <p className="font-medium">Check proposal on Vote page</p>
                                      </div>
                                      <ResponsiveDocImage 
                                        imageName="vote7.png" 
                                        alt="Proposal table on Vote Page" 
                                        caption="Proposal table on Vote page" 
                                      />
                                    </div>

                                    {/* Governance Step 10 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">8</div>
                                        <p className="font-medium">If vote period ends, Queue proposal</p>
                                      </div>
                                    </div>

                                    {/* Governance Step 11 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">9</div>
                                        <p className="font-medium">Execute proposal</p>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
                                      <div className="flex items-start gap-3">
                                        <Vote className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                          <h4 className="font-semibold text-green-700 dark:text-green-300">Voting Rights</h4>
                                          <p className="text-green-600 dark:text-green-400">Voting rights are determined by STL token holdings, and delegation is required.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* Requirements */}
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                              <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>WalletConnect compatible wallet connection</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Sufficient gas fees (ETH)</span>
                                </li>
                                {activeSection === "join-challenge" && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Entry fee (small amount of USDC - for prize pool)</span>
                                  </li>
                                )}
                                {activeSection === "vote" && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>STL token holding and delegation</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
