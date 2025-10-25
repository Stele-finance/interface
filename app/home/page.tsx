"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Wallet, Trophy, Briefcase, Star, Shield, Globe, Clock } from "lucide-react"

export default function HomePage() {
  const { t } = useLanguage()
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/dashboard/challenge')
  }

  const handleBrowseChallenges = () => {
    router.push('/dashboard/fund')
  }

  return (
    <div className="min-h-screen -m-4 md:-m-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 opacity-50"></div>
        <div className="container mx-auto px-6 py-20 lg:py-24 relative z-10">
          <div className="text-center space-y-12">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl md:text-5xl lg:text-6xl text-white font-bold leading-tight mb-8">
                {t('areYouReadyToBeLegend')}
              </h1>
              <p className="text-xl md:text-2xl text-blue-300 font-medium mb-8">
                🚀 {t('carveYourNameOnBlockchain')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                className="group bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-xl cursor-pointer flex items-center transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-2xl hover:scale-105 transform"
                onClick={handleGetStarted}
              >
                {t('virtualTradingChallenge')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <button
                className="group bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-xl cursor-pointer flex items-center transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-2xl hover:scale-105 transform"
                onClick={handleBrowseChallenges}
              >
                {t('cryptoFund')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Finance Limitations */}
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {t('traditionalFinanceLimitations')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <Shield className="h-8 w-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-200 text-lg">{t('complexBankProcedures')}</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <Star className="h-8 w-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-200 text-lg">{t('highMinimumInvestment')}</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <Globe className="h-8 w-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-200 text-lg">{t('thirdWorldInfrastructure')}</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <Clock className="h-8 w-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-200 text-lg">{t('noCreditAccess')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stele Innovation */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
              {t('steleInnovation')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Single Wallet */}
              <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Wallet className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    📱 {t('singleWalletStart')}
                  </h3>
                  <div className="space-y-3 text-left">
                    <p className="text-blue-200">• {t('instantAccountCreation')}</p>
                    <p className="text-blue-200">• {t('borderlessAccess')}</p>
                    <p className="text-blue-200">• {t('alwaysAvailable')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Transparent Verification */}
              <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    🏆 {t('transparentVerification')}
                  </h3>
                  <div className="space-y-3 text-left">
                    <p className="text-green-200">• {t('tradingCompetition')}</p>
                    <p className="text-green-200">• {t('blockchainRecord')}</p>
                    <p className="text-green-200">• {t('nftCertification')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Everyone Fund Manager */}
              <Card className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-500/30 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    💼 {t('everyoneFundManager')}
                  </h3>
                  <div className="space-y-3 text-left">
                    <p className="text-amber-200">• {t('createOwnFund')}</p>
                    <p className="text-amber-200">• {t('transparentReturns')}</p>
                    <p className="text-amber-200">• {t('globalInvestors')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* User Benefits */}
      <section className="py-16 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 p-8">
              <CardContent className="space-y-8">
                <h4 className="text-xl md:text-2xl font-bold text-yellow-300 mb-6">
                  {t('skillAsAsset')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="space-y-2">
                    <p className="text-yellow-200">• {t('earnPrizesWithSkill')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-yellow-200">• {t('nftCollection')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-yellow-200">• {t('investorsComeToyou')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
} 