"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/app/hooks/useWallet"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  Trophy, 
  Zap, 
  Target, 
  TrendingUp,
  ArrowRight,
  Star,
  Crown,
  Gem
} from "lucide-react"
import { cn } from "@/lib/utils"



// Feature explanation cards
const getFeatureCards = (t: any) => [
  {
    title: t('seedMoney'),
    image: "/home/seedmoney.png",
    description: t('seedMoneySystemDesc')
  },
  {
    title: t('rewardDistribution'),
    image: "/home/rewardTransactions.png",
    description: t('rewardDistributionSystemDesc')
  },
  {
    title: t('governanceVoting'),
    image: "/home/createProposal.png",
    description: t('governanceVotingSystemDesc')
  },
  {
    title: t('stlTokenAirdrop'),
    image: "/home/airbrop.png",
    description: t('stlTokenAirdropDesc')
  }
]

// Mock app interface components data
const getAppComponents = (t: any) => [
  {
    type: "wallet",
    title: t('uniswapWallet'),
    description: t('uniswapWalletDesc'),
    content: {
      balance: "$2,822.39",
      change: "+$156.01 (0.69%)",
      tokens: [
        { name: "Ethereum", symbol: "ETH", price: "$3,758.48", change: "+4.63%", icon: "🔵" },
        { name: "USD Coin", symbol: "USDC", price: "$1.00", change: "+0.04%", icon: "🔵" },
        { name: "Uniswap", symbol: "UNI", price: "$10.66", change: "+4.83%", icon: "🦄" }
      ]
    }
  },
  {
    type: "challenge",
    title: t('challengeProgress'), 
    description: t('challengeProgressDesc'),
    content: {
      challengeId: 2,
      seedMoney: "$1000",
      progress: 57,
      startDate: "7/4/2025",
      endDate: "8/3/2025"
    }
  },
  {
    type: "swap",
    title: t('tokenSwap'),
    description: t('tokenSwapDesc'),
    content: {
      fromToken: "ETH",
      toToken: "USDC",
      amount: "1.5"
    }
  },
  {
    type: "portfolio",
    title: t('portfolioOverview'),
    description: t('portfolioOverviewDesc'),
    content: {
      totalValue: "$5,247",
      dailyChange: "+2.3%",
      holdings: 8
    }
  }
]

export default function HomePage() {
  const { t } = useLanguage()
  const { isConnected } = useWallet()
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  const handleBrowseChallenges = () => {
    router.push('/challenges')
  }

  return (
    <div className="min-h-screen">




        
             {/* Hero Section */}
       <section className="relative overflow-hidden">
         <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
         
         <div className="container mx-auto px-6 py-20 lg:py-20">
          {/* Main Title */}
          <div className="text-center space-y-8 mb-0">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-gray-100 leading-tight">
                <span className="text-white font-bold">
                  {t('areYouReadyToBeLegend')}
                </span>
                <br />
                <span className="text-xl md:text-xl lg:text-xl text-gray-300">
                  {t('carveYourNameOnBlockchain')}
                </span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-50">
              <div 
                className="group bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold px-6 py-3 text-base rounded-lg cursor-pointer flex items-center justify-center transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-2xl hover:scale-105 hover:brightness-110"
                onClick={handleGetStarted}
                style={{ 
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'auto'
                }}
              >
                {t('becomeLegend')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              
              <div 
                className="group border-2 border-gray-600 text-gray-300 px-6 py-3 text-base rounded-lg cursor-pointer transition-all duration-300 hover:border-gray-400 hover:text-white hover:bg-gray-700 hover:shadow-2xl hover:scale-105"
                onClick={handleBrowseChallenges}
                style={{ 
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'auto'
                }}
              >
                {t('browseChallenges')}
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Feature Cards Section */}
        <section className="py-8">
          <div className="container mx-auto px-2 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {getFeatureCards(t).map((card, index) => (
                <Card key={index} className="bg-transparent border-transparent transition-all duration-500 hover:transform hover:scale-[1.02]">
                  <CardContent className="p-6 space-y-4">
                    {/* Card Title */}
                    <h3 className="text-3xl text-gray-100 mb-4">{card.title}</h3>
                    
                    {/* Card Image */}
                    <div className="w-full">
                      <Image
                        src={card.image}
                        alt={card.title}
                        width={400}
                        height={250}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                    
                    {/* Card Description */}
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </div>
  )
} 