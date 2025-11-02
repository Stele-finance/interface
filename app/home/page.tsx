"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { ArrowRight, Wallet, Trophy, Briefcase, Star, Shield, Globe, Clock, Sparkles } from "lucide-react"
import { ActiveChallenges } from "@/app/challenge/components/ActiveChallenges"
import { Funds } from "@/app/fund/components/Funds"
import { useState, useEffect } from "react"

export default function HomePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'arbitrum'>('ethereum')

  // Load network selection from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('selected-network')
    if (savedNetwork === 'ethereum' || savedNetwork === 'arbitrum') {
      setSelectedNetwork(savedNetwork)
    }

    // Listen for network changes from Header
    const handleNetworkChanged = (event: CustomEvent) => {
      const { network } = event.detail
      setSelectedNetwork(network)
    }

    window.addEventListener('networkChanged', handleNetworkChanged as EventListener)

    return () => {
      window.removeEventListener('networkChanged', handleNetworkChanged as EventListener)
    }
  }, [])

  const handleGetStarted = () => {
    router.push('/challenges')
  }

  const handleBrowseChallenges = () => {
    router.push('/funds')
  }

  return (
    <div className="min-h-screen -m-4 md:-m-6">
      {/* Hero Section with Radial Gradient */}
      <section className="relative overflow-hidden">
        {/* Background with subtle radial gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.15), transparent 50%)',
          }}
        ></div>

        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 relative z-10">
          <div className="text-center space-y-8 sm:space-y-12 animate-fade-in">
            {/* Main Heading */}
            <div className="max-w-2xl mx-auto space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold leading-tight tracking-tight">
                {t('winAndGetPrizeMoney')}
              </h1>
            </div>

            {/* Active Challenges */}
            <div className="w-full max-w-2xl mx-auto animate-fade-in-delayed">
              <ActiveChallenges
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
                hideHeader={true}
              />
            </div>
          </div>
        </div>

        {/* Decorative gradient orb */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 sm:h-48 bg-gradient-to-t from-amber-500/10 to-transparent blur-3xl"></div>
      </section>

      {/* Become an investment legend - Funds Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-bold leading-tight tracking-tight text-center mb-8 sm:mb-12 animate-fade-in">
              {t('becomeAnInvestmentLegend')}
            </h2>
            <div>
              <Funds
                showCreateButton={false}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
                hideHeader={true}
                itemsPerPage={3}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Finance Limitations - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12 animate-fade-in">
              {t('traditionalFinanceLimitations')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {[
                { icon: Shield, text: t('complexBankProcedures') },
                { icon: Star, text: t('highMinimumInvestment') },
                { icon: Globe, text: t('thirdWorldInfrastructure') },
                { icon: Clock, text: t('noCreditAccess') }
              ].map((item, index) => (
                <div
                  key={index}
                  className="glass-card bg-red-950/20 border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover-lift group animate-slide-in-right"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-red-200 text-lg sm:text-xl lg:text-2xl text-center leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stele Innovation - Modern Cards */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-10 sm:mb-16 animate-fade-in">
              {t('steleInnovation')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Single Wallet Card */}
              <Card className="glass-card bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in">
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <div className="bg-cyan-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-cyan-500/20">
                    <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">
                    {t('singleWalletStart')}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-cyan-100/90 text-lg sm:text-xl leading-relaxed">{t('instantAccountCreation')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-cyan-100/90 text-lg sm:text-xl leading-relaxed">{t('borderlessAccess')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-cyan-100/90 text-lg sm:text-xl leading-relaxed">{t('alwaysAvailable')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transparent Verification Card */}
              <Card className="glass-card bg-gradient-to-br from-emerald-500/10 to-green-600/10 border-emerald-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in" style={{ animationDelay: '150ms' }}>
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <div className="bg-emerald-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-emerald-500/20">
                    <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">
                    {t('transparentVerification')}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-emerald-100/90 text-lg sm:text-xl leading-relaxed">{t('tradingCompetition')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-emerald-100/90 text-lg sm:text-xl leading-relaxed">{t('blockchainRecord')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-emerald-100/90 text-lg sm:text-xl leading-relaxed">{t('nftCertification')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Everyone Fund Manager Card */}
              <Card className="glass-card bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in" style={{ animationDelay: '300ms' }}>
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <div className="bg-amber-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-amber-500/20">
                    <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">
                    {t('everyoneFundManager')}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-amber-100/90 text-lg sm:text-xl leading-relaxed">{t('createOwnFund')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-amber-100/90 text-lg sm:text-xl leading-relaxed">{t('transparentReturns')}</p>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 mt-1.5 sm:mt-2 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-amber-100/90 text-lg sm:text-xl leading-relaxed">{t('globalInvestors')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* User Benefits - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-slate-950"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Heading with gradient text */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14 animate-fade-in">
              <span className="gradient-text">{t('skillAsAsset')}</span>
            </h2>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Earn Prizes Card */}
              <Card className="glass-card bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-amber-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-amber-500/20">
                    <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
                  </div>
                  <p className="text-amber-100/90 text-lg sm:text-xl lg:text-2xl leading-relaxed">
                    {t('earnPrizesWithSkill')}
                  </p>
                </CardContent>
              </Card>

              {/* NFT Collection Card */}
              <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in" style={{ animationDelay: '150ms' }}>
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-purple-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-purple-500/20">
                    <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400" />
                  </div>
                  <p className="text-purple-100/90 text-lg sm:text-xl lg:text-2xl leading-relaxed">
                    {t('nftCollection')}
                  </p>
                </CardContent>
              </Card>

              {/* Investors Card */}
              <Card className="glass-card bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20 rounded-2xl sm:rounded-3xl overflow-hidden group hover-lift animate-fade-in" style={{ animationDelay: '300ms' }}>
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-blue-500/10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-500/20">
                    <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
                  </div>
                  <p className="text-blue-100/90 text-lg sm:text-xl lg:text-2xl leading-relaxed">
                    {t('investorsComeToyou')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom decorative gradient */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 sm:h-48 bg-gradient-to-t from-purple-500/5 to-transparent blur-3xl"></div>
      </section>
    </div>
  )
} 