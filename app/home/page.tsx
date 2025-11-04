"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { Wallet, Trophy, Briefcase, Sparkles, Users, Lock, BarChart3, Eye, CheckCircle2 } from "lucide-react"
import { Funds } from "@/app/fund/components/Funds"
import { useState, useEffect } from "react"

export default function HomePage() {
  const { t } = useLanguage()
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

  return (
    <div className="min-h-screen -m-4 md:-m-6">
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

      {/* Platform Introduction - Challenge & Fund */}
      <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden bg-slate-950">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900"></div>
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                {t('ethereumArbitrumSupport')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {t('blockchainBasedPlatform')}
              </p>
            </div>

            {/* Main Feature - Centered */}
            <div className="max-w-3xl mx-auto">
              {/* Crypto Fund Card */}
              <div className="glass-card bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-sky-500/5 border-blue-500/20 rounded-3xl overflow-hidden group hover-lift animate-fade-in">
                <div className="p-6 sm:p-8 lg:p-10">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <div className="bg-blue-500/10 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-500/20">
                      <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">{t('cryptoFund')}</h3>
                      <p className="text-blue-400 text-sm sm:text-base font-medium mt-1">Crypto Fund</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-xl sm:text-2xl leading-relaxed mb-6 sm:mb-8">
                    {t('fundManagerDescription')}
                  </p>

                  {/* Features List */}
                  <div className="space-y-4 sm:space-y-5">
                    <div className="flex items-start gap-3 group/item">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div>
                        <p className="text-white font-semibold text-xl sm:text-2xl">{t('managerAndInvestor')}</p>
                        <p className="text-slate-400 text-lg sm:text-xl mt-1">{t('managerAndInvestorDesc')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 group/item">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div>
                        <p className="text-white font-semibold text-xl sm:text-2xl">{t('realtimeTransparency')}</p>
                        <p className="text-slate-400 text-lg sm:text-xl mt-1">{t('realtimeTransparencyDesc')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 group/item">
                      <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div>
                        <p className="text-white font-semibold text-xl sm:text-2xl">{t('secureFundManagement')}</p>
                        <p className="text-slate-400 text-lg sm:text-xl mt-1">{t('secureFundManagementDesc')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 group/item">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div>
                        <p className="text-white font-semibold text-xl sm:text-2xl">{t('performanceProof')}</p>
                        <p className="text-slate-400 text-lg sm:text-xl mt-1">{t('performanceProofDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      <p className="text-cyan-100/90 text-lg sm:text-xl leading-relaxed">{t('availableByLinkingWallet')}</p>
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