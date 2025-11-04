/* eslint-disable react/no-unescaped-entities */
"use client"

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-muted/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stele Finance Terms of Service
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Last modified: Oct 30, 2025
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-muted/40 border-border/50">
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6" suppressHydrationWarning>
              <div className="space-y-4">
                <p>
                  <strong>Stele Finance</strong> (to be incorporated as Stele Finance Pte Ltd in Singapore)<br />
                  <strong>Email:</strong> stelefinance@gmail.com<br />
                  <strong>Website:</strong> <a href="https://stele.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://stele.io</a>
                </p>

                <p>
                  These Terms of Service (the "Agreement") explain the terms and conditions by which you may access and use the Products provided by provided by Stele Finance(to be incorporated as Stele Finance Pte Ltd in Singapore) (d/b/a Stele Finance and referred to herein as "Stele," "we," "our," or "us"). The Products shall include, but shall not necessarily be limited to, (a) a website-hosted user interface located at <a href="https://stele.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://stele.io</a> (the "Interface" or "App") (b) any other products and services that link to this Agreement (together with the Interface). You must read this Agreement carefully as it governs your use of the Products. By accessing or using any of the Products, you signify that you have read, understand, and agree to be bound by this Agreement in its entirety. If you do not agree, you are not authorized to access or use any of our Products and should not use our Products.
                </p>

                <p>
                  To access or use any of our Products, you must be able to form a legally binding contract with us. Accordingly, you represent that you are at least the age of majority in your jurisdiction (e.g., 18 years old in the United States) and have the full right, power, and authority to enter into and comply with the terms and conditions of this Agreement on behalf of yourself and any company or legal entity for which you may access or use the Interface. If you are entering into this Agreement on behalf of an entity, you represent to us that you have the legal authority to bind such entity.
                </p>

                <p>
                  You further represent that you are not (a) the subject of economic or trade sanctions administered or enforced by any governmental authority or otherwise designated on any list of prohibited or restricted parties (including but not limited to the list maintained by the Office of Foreign Assets Control of the U.S. Department of the Treasury) or (b) a citizen, resident, or organized in a jurisdiction or territory that is the subject of comprehensive country-wide, territory-wide, or regional economic sanctions by the United States. Finally, you represent that your access and use of any of our Products will fully comply with all applicable laws and regulations, and that you will not access or use any of our Products to conduct, promote, or otherwise facilitate any illegal activity.
                </p>

                <p>
                  <strong>NOTICE:</strong> This Agreement contains important information, including a binding arbitration provision and a class action waiver, both of which impact your rights as to how disputes are resolved. Our Products are only available to you — and you should only access any of our Products — if you agree completely with these terms.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">1. Our Products</h2>

                <h3 className="text-xl font-semibold text-foreground">1.1 The Interface</h3>
                <p>
                  The Interface provides a web or mobile-based means of access to decentralized protocols on various public blockchains, including but not limited to Ethereum, that allows users to trade certain compatible digital assets.
                </p>

                <p>
                  The Interface is distinct from the Stele Protocol and is one, but not the exclusive, means of accessing the Protocol. The Protocol comprises open-source or source-available self-executing smart contracts that are deployed on various public blockchains, such as Ethereum and Arbitrum. By using the Interface, you understand that you are not buying or selling digital assets from us. Stele Finance does not manage fund assets. Deposits and withdrawals of fund assets can only be performed by the investor themselves. Fund fees are allocated to the fund manager in accordance with the Protocol. Fund managers may only rebalance the fund portfolio by swapping assets. Stele Finance does not supervise or control fund managers. The Protocol was initially deployed on the Ethereum and Arbitrum blockchain. Please note that digital assets that have been "bridged" or "wrapped" to operate on other blockchain networks (including to blockchains compatible with the Ethereum Virtual Machine that are designed to ensure the Ethereum blockchain can effectively process more transactions or other blockchains that are frequently referred to as "Layer 2" solutions) are distinct from the original Ethereum mainnet asset.
                </p>

                <p>
                  To access the Interface, you must use a non-custodial wallet software, which allows you to interact with public blockchains. Your relationship with that non-custodial wallet provider is governed by the applicable terms of service. We do not have custody or control over the contents of your wallet and have no ability to retrieve or transfer its contents. By connecting your wallet to our Interface, you agree to be bound by this Agreement and all of the terms incorporated herein by reference.
                </p>

                <h3 className="text-xl font-semibold text-foreground">1.2 Access through Third-Party Partners</h3>
                <p>
                  We may make certain Products, including access to our APIs, liquidity services, and data, accessible or usable through interfaces, products or services provided by certain third-party partners, such as exchanges and trading platforms (each a "Third-Party Partner"). You agree that your use of the Products through an interface, product or service provided by one of our Third-Party Partners is nonetheless still subject to the terms and conditions of this Agreement.
                </p>

                <h3 className="text-xl font-semibold text-foreground">1.4 Other Products</h3>
                <p>
                  We may from time to time in the future offer additional products, and such additional products shall be considered a Product as used herein, regardless of whether such product is specifically defined in this Agreement.
                </p>

                <h3 className="text-xl font-semibold text-foreground">1.5 Third-Party Services and Content</h3>
                <p>
                  Our Products may include integrations, links or other access to third-party services, sites, technology, APIs, content and resources (each a "Third-Party Service"). Your access and use of the Third-Party Services may also be subject to additional terms and conditions, privacy policies, or other agreements with such third party, and you may be required to authenticate to or create separate accounts to use Third-Party Services on the websites or via the technology platforms of their respective providers. You agree to comply with all terms, conditions, and policies applicable to any Third-Party Services integrated with or made available through the Products. You acknowledge that such Third-Party Services are owned by their respective licensors and you further agree not to take any action that would violate the applicable licensor's ownership or intellectual property rights in the Third-Party Services.
                </p>

                <p>
                  You, and not Stele, will be responsible for any and all costs and charges associated with your use of any Third-Party Services. Stele enables these Third-Party Services merely as a convenience and the integration or inclusion of such Third-Party Services does not imply an endorsement or recommendation. Any dealings you have with third parties while using our Products are between you and the third party. Stele will not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any Third-Party Services.
                </p>

                <p>
                  Some Third-Party Services will provide us with access to certain information that you have provided to third parties, including through such Third-Party Services, and we will use, store and disclose such information in accordance with our Privacy Policy. For more information about the implications of activating Third-Party Services and our use, storage and disclosure of information related to you and your use of such Third-Party Services within our Products, please see our Privacy Policy.
                </p>

                <p>
                  Stele has no control over and is not responsible for such Third-Party Services, including for the accuracy, availability, reliability, or completeness of information shared by or available through Third-Party Services, or on the privacy practices of Third-Party Services. If you have any questions regarding how the third party may process your personal information, we encourage you to review the privacy policies of the third parties providing Third-Party Services prior to using such services.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">2. Modifications of this Agreement or our Products</h2>

                <h3 className="text-xl font-semibold text-foreground">2.1 Modifications of this Agreement</h3>
                <p>
                  We reserve the right, in our sole discretion, to modify this Agreement from time to time. If we make any material modifications, we will notify you by updating the date at the top of the Agreement and by maintaining a current version of the Agreement at https://stele.io/terms-of-service. All modifications will be effective when they are posted, and your continued accessing or use of any of the Products will serve as confirmation of your acceptance of those modifications. If you do not agree with any modifications to this Agreement, you must immediately stop accessing and using all of our Products.
                </p>

                <h3 className="text-xl font-semibold text-foreground">2.2 Modifications of our Products</h3>
                <p>
                  We reserve the following rights, which do not constitute obligations of ours: (a) with or without notice to you, to modify, substitute, eliminate or add to any of the Products; (b) to review, modify, filter, disable, delete and remove any and all content and information from any of the Products.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">3. Intellectual Property Rights</h2>

                <h3 className="text-xl font-semibold text-foreground">3.1 IP Rights Generally</h3>
                <p>
                  We own all intellectual property and other rights in each of our Products and its respective contents, including, but not limited to, software, text, images, trademarks, service marks, copyrights, patents, designs, and its "look and feel." This intellectual property is available under the terms of our copyright licenses and our Trademark Guidelines. Subject to the terms of this Agreement, we grant you a limited, revocable, non-exclusive, non-sublicensable, non-transferable license to access and use our Products solely in accordance with this Agreement. You agree that you will not use, modify, distribute, tamper with, reverse engineer, disassemble or decompile any of our Products for any purpose other than as expressly permitted pursuant to this Agreement. Except as set forth in this Agreement, we grant you no rights to any of our Products, including any intellectual property rights.
                </p>

                <p>
                  You understand and acknowledge that the Protocol is not a Product and we do not control the Protocol.
                </p>

                <p>
                  By using any of our Products, you grant us a worldwide, non-exclusive, sublicensable, royalty-free license to use, copy, modify, and display any content, including but not limited to text, materials, images, files, communications, comments, feedback, suggestions, ideas, concepts, questions, data, or otherwise, that you post on or through any of our Products for our current and future business purposes, including to provide, promote, and improve the services. You grant to us a non-exclusive, transferable, worldwide, perpetual, irrevocable, fully-paid, royalty-free license, with the right to sublicense, under any and all intellectual property rights that you own or control to use, copy, modify, create derivative works based upon any suggestions or feedback for any purpose.
                </p>

                <p>
                  You represent and warrant that you have, or have obtained, all rights, licenses, consents, permissions, power and/or authority necessary to grant the rights granted herein for any material that you list, post, promote, or display on or through any of our Products. You represent and warrant that such content does not contain material subject to copyright, trademark, publicity rights, or other intellectual property rights, unless you have necessary permission or are otherwise legally entitled to post the material and to grant us the license described above, and that the content does not violate any laws.
                </p>

                <h3 className="text-xl font-semibold text-foreground">3.2 Third-Party Resources and Promotions</h3>
                <p>
                  Our Products may contain references or links to third-party resources, including, but not limited to, information, materials, products, or services, that we do not own or control. In addition, third parties may offer promotions related to your access and use of our Products. We do not approve, monitor, endorse, warrant or assume any responsibility for any such resources or promotions. If you access any such resources or participate in any such promotions, you do so at your own risk, and you understand that this Agreement does not apply to your dealings or relationships with any third parties. You expressly relieve us of any and all liability arising from your use of any such resources or participation in any such promotions.
                </p>

                <h3 className="text-xl font-semibold text-foreground">3.3 Additional Rights</h3>
                <p>
                  We reserve the right to cooperate with any law enforcement, court or government investigation or order or third party requesting or directing that we disclose information or content or information that you provide.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">4. Your Responsibilities</h2>

                <h3 className="text-xl font-semibold text-foreground">4.1 Prohibited Activity</h3>
                <p>
                  You agree not to engage in, or attempt to engage in, any of the following categories of prohibited activity in relation to your access and use of the Interface:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Intellectual Property Infringement.</strong> Activity that infringes on or violates any copyright, trademark, service mark, patent, right of publicity, right of privacy, or other proprietary or intellectual property rights under the law.
                  </li>
                  <li>
                    <strong>Cyberattack.</strong> Activity that seeks to interfere with or compromise the integrity, security, or proper functioning of any computer, server, network, personal device, or other information technology system, including, but not limited to, the deployment of viruses and denial of service attacks.
                  </li>
                  <li>
                    <strong>Fraud and Misrepresentation.</strong> Activity that seeks to defraud us or any other person or entity, including, but not limited to, providing any false, inaccurate, or misleading information in order to unlawfully obtain the property of another.
                  </li>
                  <li>
                    <strong>Market Manipulation.</strong> Activity that violates any applicable law, rule, or regulation concerning the integrity of trading markets, including, but not limited to, the manipulative tactics commonly known as "rug pulls," pumping and dumping, and wash trading.
                  </li>
                  <li>
                    <strong>Securities and Derivatives Violations.</strong> Activity that violates any applicable law, rule, or regulation concerning the trading of securities or derivatives, including, but not limited to, the unregistered offering of securities and the offering of leveraged and margined commodity products to retail customers in the United States.
                  </li>
                  <li>
                    <strong>Sale of Stolen Property.</strong> Buying, selling, or transferring of stolen items, fraudulently obtained items, items taken without authorization, and/or any other illegally obtained items.
                  </li>
                  <li>
                    <strong>Data Mining or Scraping.</strong> Activity that involves data mining, robots, scraping, or similar data gathering or extraction methods of content or information from any of our Products.
                  </li>
                  <li>
                    <strong>Objectionable Content.</strong> Activity that involves soliciting information from anyone under the age of 18 or that is otherwise harmful, threatening, abusive, harassing, tortious, excessively violent, defamatory, vulgar, obscene, pornographic, libelous, invasive of another's privacy, hateful, discriminatory, or otherwise objectionable.
                  </li>
                  <li>
                    <strong>Any Other Unlawful Conduct.</strong> Activity that violates any applicable law, rule, or regulation of the United States or another relevant jurisdiction, including, but not limited to, the restrictions and regulatory requirements imposed by U.S. law.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground">4.2 Trading</h3>
                <p>
                  You agree and understand that: (a) all trades you submit through any of our Products are considered unsolicited, which means that they are solely initiated by you; (b) you have not received any investment advice from us in connection with any trades, including those you place via our Auto Routing API; and (c) we do not conduct a suitability review of any trades you submit.
                </p>

                <h3 className="text-xl font-semibold text-foreground">4.3 Non-Custodial and No Fiduciary Duties</h3>
                <p>
                  Each of the Products is a purely non-custodial application, meaning we do not ever have custody, possession, or control of your digital assets at any time. It further means you are solely responsible for the custody of the cryptographic private keys to the digital asset wallets you hold and you should never share your wallet credentials or seed phrase with anyone. We accept no responsibility for, or liability to you, in connection with your use of a wallet and make no representations or warranties regarding how any of our Products will operate with any specific wallet. Likewise, you are solely responsible for any associated wallet and we are not liable for any acts or omissions by you in connection with or as a result of your wallet being compromised.
                </p>

                <p>
                  This Agreement is not intended to, and does not, create or impose any fiduciary duties on us. To the fullest extent permitted by law, you acknowledge and agree that we owe no fiduciary duties or liabilities to you or any other party, and that to the extent any such duties or liabilities may exist at law or in equity, those duties and liabilities are hereby irrevocably disclaimed, waived, and eliminated. You further agree that the only duties and obligations that we owe you are those set out expressly in this Agreement.
                </p>

                <h3 className="text-xl font-semibold text-foreground">4.4 Compliance and Tax Obligations</h3>
                <p>
                  One or more of our Products may not be available or appropriate for use in your jurisdiction. By accessing or using any of our Products, you agree that you are solely and entirely responsible for compliance with all laws and regulations that may apply to you. Specifically, your use of our Products or the Protocol may result in various tax consequences, such as income or capital gains tax, value-added tax, goods and services tax, or sales tax in certain jurisdictions.
                </p>

                <p>
                  It is your responsibility to determine whether taxes apply to any transactions you initiate or receive and, if so, to report and/or remit the correct tax to the appropriate tax authority.
                </p>

                <h3 className="text-xl font-semibold text-foreground">4.5 Gas Fees</h3>
                <p>
                  Blockchain transactions require the payment of transaction fees to the appropriate network ("Gas Fees"). Except as otherwise expressly set forth in the terms of another offer by Stele, you will be solely responsible to pay the Gas Fees for any transaction that you initiate via any of our Products.
                </p>

                <h3 className="text-xl font-semibold text-foreground">4.6 Release of Claims</h3>
                <p>
                  You expressly agree that you assume all risks in connection with your access and use of any of our Products. You further expressly waive and release us from any and all liability, claims, causes of action, or damages arising from or in any way relating to your use of any of our Products.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">5. DISCLAIMERS</h2>

                <h3 className="text-xl font-semibold text-foreground">5.1 ASSUMPTION OF RISK -- GENERALLY</h3>
                <p>
                  BY ACCESSING AND USING ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES, YOU REPRESENT THAT YOU ARE FINANCIALLY AND TECHNICALLY SOPHISTICATED ENOUGH TO UNDERSTAND THE INHERENT RISKS ASSOCIATED WITH USING CRYPTOGRAPHIC AND BLOCKCHAIN-BASED SYSTEMS, AND THAT YOU HAVE A WORKING KNOWLEDGE OF THE USAGE AND INTRICACIES OF DIGITAL ASSETS SUCH AS ETHER (ETH), STABLECOINS, AND OTHER DIGITAL TOKENS SUCH AS THOSE FOLLOWING THE ETHEREUM TOKEN STANDARD (ERC-20).
                </p>

                <p>
                  IN PARTICULAR, YOU UNDERSTAND THAT THE MARKETS FOR THESE DIGITAL ASSETS ARE NASCENT AND HIGHLY VOLATILE DUE TO RISK FACTORS INCLUDING, BUT NOT LIMITED TO, ADOPTION, SPECULATION, TECHNOLOGY, SECURITY, AND REGULATION. YOU UNDERSTAND THAT ANYONE CAN CREATE A TOKEN, INCLUDING FAKE VERSIONS OF EXISTING TOKENS AND TOKENS THAT FALSELY CLAIM TO REPRESENT PROJECTS, AND ACKNOWLEDGE AND ACCEPT THE RISK THAT YOU MAY MISTAKENLY TRADE THOSE OR OTHER TOKENS. SO-CALLED STABLECOINS MAY NOT BE AS STABLE AS THEY PURPORT TO BE, MAY NOT BE FULLY OR ADEQUATELY COLLATERALIZED, AND MAY BE SUBJECT TO PANICS AND RUNS.
                </p>

                <p>
                  FURTHER, YOU UNDERSTAND THAT SMART CONTRACT TRANSACTIONS AUTOMATICALLY EXECUTE AND SETTLE, AND THAT BLOCKCHAIN-BASED TRANSACTIONS ARE IRREVERSIBLE WHEN CONFIRMED. YOU ACKNOWLEDGE AND ACCEPT THAT THE COST AND SPEED OF TRANSACTING WITH CRYPTOGRAPHIC AND BLOCKCHAIN-BASED SYSTEMS SUCH AS ETHEREUM ARE VARIABLE AND MAY INCREASE DRAMATICALLY AT ANY TIME. YOU FURTHER ACKNOWLEDGE AND ACCEPT THE RISK OF PRICE LOSS DUE TO SLIPPAGE WHEN EXECUTING SWAP TRANSACTIONS IN FUNDS.
                </p>

                <p>
                  IF YOU DEPOSIT ASSETS INTO A FUND AND DELEGATE INVESTMENT AUTHORITY TO A FUND MANAGER, YOU UNDERSTAND AND ACCEPT THAT YOUR INVESTED CAPITAL MAY BE SUBJECT TO PARTIAL OR TOTAL LOSS DUE TO THE FUND MANAGER'S PORTFOLIO REBALANCING VIA ASSET SWAPS, REGARDLESS OF THE MANAGER'S INTENT OR PERFORMANCE.
                </p>

                <p>
                  ADDITIONALLY, YOU ACKNOWLEDGE THAT REAL-TIME PRICES DISPLAYED ON THE INTERFACE MAY NOT BE 100% IDENTICAL TO ON-CHAIN PRICES AT THE MOMENT OF TRANSACTION EXECUTION DUE TO NETWORK LATENCY, ORACLE UPDATES, OR OTHER TECHNICAL FACTORS, AND YOU ASSUME ALL RISKS ASSOCIATED WITH SUCH PRICE DISCREPANCIES.
                </p>

                <p>
                  FINALLY, YOU UNDERSTAND THAT WE DO NOT CREATE, OWN, OR OPERATE CROSS-CHAIN BRIDGES AND WE DO NOT MAKE ANY REPRESENTATION OR WARRANTY ABOUT THE SAFETY OR SOUNDNESS OF ANY CROSS-CHAIN BRIDGE.
                </p>

                <p>
                  IN SUMMARY, YOU ACKNOWLEDGE THAT WE ARE NOT RESPONSIBLE FOR ANY OF THESE VARIABLES OR RISKS, DO NOT OWN OR CONTROL THE PROTOCOL, AND CANNOT BE HELD LIABLE FOR ANY RESULTING LOSSES THAT YOU EXPERIENCE WHILE ACCESSING OR USING ANY OF OUR PRODUCTS. ACCORDINGLY, YOU UNDERSTAND AND AGREE TO ASSUME FULL RESPONSIBILITY FOR ALL OF THE RISKS OF ACCESSING AND USING THE INTERFACE TO INTERACT WITH THE PROTOCOL.
                </p>

                <h3 className="text-xl font-semibold text-foreground">5.2 NO WARRANTIES</h3>
                <p>
                  EACH OF OUR PRODUCTS AND ANY THIRD-PARTY SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, WE AND ANY PROVIDERS OF THIRD-PARTY SERVICES DISCLAIM ANY REPRESENTATIONS AND WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, THE WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. YOU ACKNOWLEDGE AND AGREE THAT YOUR USE OF EACH OF OUR PRODUCTS IS AT YOUR OWN RISK. WE DO NOT REPRESENT OR WARRANT THAT ACCESS TO ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES WILL BE CONTINUOUS, UNINTERRUPTED, TIMELY, OR SECURE; THAT THE INFORMATION CONTAINED IN ANY OF OUR PRODUCTS WILL BE ACCURATE, RELIABLE, COMPLETE, OR CURRENT; OR THAT ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES WILL BE FREE FROM ERRORS, DEFECTS, VIRUSES, OR OTHER HARMFUL ELEMENTS. NO ADVICE, INFORMATION, OR STATEMENT THAT WE MAKE SHOULD BE TREATED AS CREATING ANY WARRANTY CONCERNING ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES. WE DO NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY ADVERTISEMENTS, OFFERS, OR STATEMENTS MADE BY THIRD PARTIES CONCERNING ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES.
                </p>

                <p>
                  SIMILARLY, THE PROTOCOL IS PROVIDED "AS IS," AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. ALTHOUGH WE CONTRIBUTED TO THE INITIAL CODE FOR THE PROTOCOL, WE DO NOT PROVIDE, OWN, OR CONTROL THE PROTOCOL, WHICH IS RUN AUTONOMOUSLY WITHOUT ANY HEADCOUNT BY SMART CONTRACTS DEPLOYED ON VARIOUS BLOCKCHAINS. UPGRADES AND MODIFICATIONS TO THE PROTOCOL ARE GENERALLY MANAGED IN A COMMUNITY-DRIVEN WAY BY ANYONE. NO DEVELOPER OR ENTITY INVOLVED IN CREATING THE PROTOCOL WILL BE LIABLE FOR ANY CLAIMS OR DAMAGES WHATSOEVER ASSOCIATED WITH YOUR USE, INABILITY TO USE, OR YOUR INTERACTION WITH OTHER USERS OF, THE PROTOCOL, INCLUDING ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE OR CONSEQUENTIAL DAMAGES, OR LOSS OF PROFITS, CRYPTOCURRENCIES, TOKENS, OR ANYTHING ELSE OF VALUE. WE DO NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY ADVERTISEMENTS, OFFERS, OR STATEMENTS MADE BY THIRD PARTIES CONCERNING ANY OF OUR PRODUCTS.
                </p>

                <p>
                  WE ALSO CANNOT GUARANTEE THAT ANY NFTS VISIBLE THROUGH THE USE OF OUR PRODUCTS WILL ALWAYS REMAIN VISIBLE AND/OR AVAILABLE TO BE BOUGHT, SOLD, OR TRANSFERRED.
                </p>

                <p>
                  ANY PAYMENTS OR FINANCIAL TRANSACTIONS THAT YOU ENGAGE IN WILL BE PROCESSED VIA AUTOMATED SMART CONTRACTS. ONCE EXECUTED, WE HAVE NO CONTROL OVER THESE PAYMENTS OR TRANSACTIONS, NOR DO WE HAVE THE ABILITY TO REVERSE ANY PAYMENTS OR TRANSACTIONS.
                </p>

                <h3 className="text-xl font-semibold text-foreground">5.3 NO INVESTMENT ADVICE</h3>
                <p>
                  WE MAY PROVIDE INFORMATION ABOUT TOKENS IN OUR PRODUCTS SOURCED FROM THIRD-PARTY DATA PARTNERS. WE MAY ALSO PROVIDE WARNING LABELS FOR CERTAIN TOKENS. THE PROVISION OF INFORMATIONAL MATERIALS DOES NOT MAKE TRADES IN THOSE TOKENS SOLICITED; WE ARE NOT ATTEMPTING TO INDUCE YOU TO MAKE ANY PURCHASE AS A RESULT OF INFORMATION PROVIDED. ALL SUCH INFORMATION PROVIDED BY ANY OF OUR PRODUCTS IS FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT BE CONSTRUED AS INVESTMENT ADVICE OR A RECOMMENDATION THAT A PARTICULAR TOKEN IS A SAFE OR SOUND INVESTMENT. YOU SHOULD NOT TAKE, OR REFRAIN FROM TAKING, ANY ACTION BASED ON ANY INFORMATION CONTAINED IN ANY OF OUR PRODUCTS. BY PROVIDING TOKEN INFORMATION FOR YOUR CONVENIENCE, WE DO NOT MAKE ANY INVESTMENT RECOMMENDATIONS TO YOU OR OPINE ON THE MERITS OF ANY TRANSACTION OR OPPORTUNITY. YOU ALONE ARE RESPONSIBLE FOR DETERMINING WHETHER ANY INVESTMENT, INVESTMENT STRATEGY OR RELATED TRANSACTION IS APPROPRIATE FOR YOU BASED ON YOUR PERSONAL INVESTMENT OBJECTIVES, FINANCIAL CIRCUMSTANCES, AND RISK TOLERANCE.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">6. Indemnification</h2>
                <p>
                  You agree to hold harmless, release, defend, and indemnify Stele, our affiliates and our and our affiliates' respective officers, directors, employees, contractors, agents, service providers, licensors, and representatives (collectively, the "Stele Parties") from and against all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising from or relating to: (a) your access and use of any of our Products or any Third-Party Services; (b) your violation of any term or condition of this Agreement, the right of any third party, or any other applicable law, rule, or regulation; (c) any other party's access and use of any of our Products or any Third-Party Services with your assistance or using any device or account that you own or control; and (d) any dispute between you and (i) any other user of any of the Products or any Third-Party Services or (ii) any of your own customers or users. We will provide notice to you of any such claim, suit, or proceeding. We reserve the right to assume the exclusive defense and control of any matter which is subject to indemnification under this section, and you agree to cooperate with any reasonable requests assisting our defense of such matter. You may not settle or compromise any claim against any Stele Party without our written consent.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">7. Limitation of Liability</h2>
                <p>
                  UNDER NO CIRCUMSTANCES SHALL WE, ANY STELE PARTIES, OR ANY THIRD-PARTY SERVICES BE LIABLE TO YOU FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING, BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE PROPERTY, ARISING OUT OF OR RELATING TO ANY ACCESS OR USE OF OR INABILITY TO ACCESS OR USE ANY OF THE PRODUCTS OR ANY THIRD-PARTY SERVICES, NOR WILL WE BE RESPONSIBLE FOR ANY DAMAGE, LOSS, OR INJURY RESULTING FROM HACKING, TAMPERING, OR OTHER UNAUTHORIZED ACCESS OR USE OF ANY OF THE PRODUCTS, THIRD-PARTY SERVICES OR THE INFORMATION CONTAINED WITHIN IT, WHETHER SUCH DAMAGES ARE BASED IN CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, ARISING OUT OF OR IN CONNECTION WITH AUTHORIZED OR UNAUTHORIZED USE OF ANY OF THE PRODUCTS OR ANY THIRD-PARTY SERVICES, EVEN IF AN AUTHORIZED REPRESENTATIVE OF STELE HAS BEEN ADVISED OF OR KNEW OR SHOULD HAVE KNOWN OF THE POSSIBILITY OF SUCH DAMAGES. WE ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY: (A) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (B) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM ANY ACCESS OR USE OF THE INTERFACE; (C) UNAUTHORIZED ACCESS OR USE OF ANY SECURE SERVER OR DATABASE IN OUR CONTROL, OR THE USE OF ANY INFORMATION OR DATA STORED THEREIN; (D) INTERRUPTION OR CESSATION OF FUNCTION RELATED TO ANY OF THE PRODUCTS OR THIRD-PARTY SERVICES; (E) BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH THE INTERFACE; (F) ERRORS OR OMISSIONS IN, OR LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF, ANY CONTENT MADE AVAILABLE THROUGH ANY OF THE PRODUCTS OR THIRD-PARTY SERVICES; AND (G) THE DEFAMATORY, OFFENSIVE, OR ILLEGAL CONDUCT OF ANY THIRD PARTY.
                </p>

                <p>
                  WE HAVE NO LIABILITY TO YOU OR TO ANY THIRD PARTY FOR ANY CLAIMS OR DAMAGES THAT MAY ARISE AS A RESULT OF ANY PAYMENTS OR TRANSACTIONS THAT YOU ENGAGE IN VIA ANY OF OUR PRODUCTS OR ANY THIRD-PARTY SERVICES, OR ANY OTHER PAYMENT OR TRANSACTIONS THAT YOU CONDUCT VIA ANY OF OUR PRODUCTS. EXCEPT AS EXPRESSLY PROVIDED FOR HEREIN, WE DO NOT PROVIDE REFUNDS FOR ANY PURCHASES THAT YOU MIGHT MAKE ON OR THROUGH ANY OF OUR PRODUCTS.
                </p>

                <p>
                  NEITHER WE NOR ANY PROVIDERS OF THIRD-PARTY SERVICES MAKE ANY WARRANTIES OR REPRESENTATIONS, EXPRESS OR IMPLIED, ABOUT LINKED THIRD-PARTY SERVICES, THE THIRD PARTIES THEY ARE OWNED AND OPERATED BY, THE INFORMATION CONTAINED ON THEM, ASSETS AVAILABLE THROUGH THEM, OR THE SUITABILITY, PRIVACY, OR SECURITY OF THEIR PRODUCTS OR SERVICES. YOU ACKNOWLEDGE SOLE RESPONSIBILITY FOR AND ASSUME ALL RISK ARISING FROM YOUR USE OF THIRD-PARTY SERVICES, THIRD-PARTY WEBSITES, APPLICATIONS, OR RESOURCES. WE SHALL NOT BE LIABLE UNDER ANY CIRCUMSTANCES FOR DAMAGES ARISING OUT OF OR IN ANY WAY RELATED TO SOFTWARE, PRODUCTS, SERVICES, AND/OR INFORMATION OFFERED OR PROVIDED BY THIRD-PARTIES AND ACCESSED THROUGH ANY OF OUR PRODUCTS.
                </p>

                <p>
                  SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR PERSONAL INJURY, OR OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THIS LIMITATION MAY NOT APPLY TO YOU. IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES (OTHER THAN AS MAY BE REQUIRED BY APPLICABLE LAW IN CASES INVOLVING PERSONAL INJURY) EXCEED THE AMOUNT OF ONE HUNDRED U.S. DOLLARS ($100.00 USD) OR ITS EQUIVALENT IN THE LOCAL CURRENCY OF THE APPLICABLE JURISDICTION.
                </p>

                <p>
                  THE FOREGOING DISCLAIMER WILL NOT APPLY TO THE EXTENT PROHIBITED BY LAW.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">8. Governing Law, Dispute Resolution and Class Action Waivers</h2>

                <h3 className="text-xl font-semibold text-foreground">8.1 Governing Law</h3>
                <p>
                  You agree that the laws of Singapore, without regard to principles of conflict of laws, govern this Agreement and any Dispute between you and us. You further agree that each of our Products shall be deemed to be based solely in Singapore, and that although a Product may be available in other jurisdictions, its availability does not give rise to general or specific personal jurisdiction in any forum outside Singapore. The parties acknowledge that this Agreement evidences interstate commerce. Any arbitration conducted pursuant to this Agreement shall be governed by the Arbitration Act (Cap. 10) of Singapore. You agree that the courts of Singapore are the proper forum for any appeals of an arbitration award or for court proceedings in the event that this Agreement's binding arbitration clause is found to be unenforceable.
                </p>

                <h3 className="text-xl font-semibold text-foreground">8.2 Dispute Resolution</h3>
                <p>
                  We will use our best efforts to resolve any potential disputes through informal, good faith negotiations. If a potential dispute arises, you must contact us by sending an email to stelefinance@gmail.com so that we can attempt to resolve it without resorting to formal dispute resolution.
                </p>

                <h3 className="text-xl font-semibold text-foreground">8.3 Class Action and Jury Trial Waiver</h3>
                <p>
                  You must bring any and all Disputes against us in your individual capacity and not as a plaintiff in or member of any purported class action, collective action, private attorney general action, or other representative proceeding. This provision applies to class arbitration. You and we both agree to waive the right to demand a trial by jury.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">9. Miscellaneous</h2>

                <h3 className="text-xl font-semibold text-foreground">9.1 Entire Agreement</h3>
                <p>
                  These terms constitute the entire agreement between you and us with respect to the subject matter hereof. This Agreement supersedes any and all prior or contemporaneous written and oral agreements, communications and other understandings (if any) relating to the subject matter of the terms.
                </p>

                <h3 className="text-xl font-semibold text-foreground">9.2 Assignment</h3>
                <p>
                  You may not assign or transfer this Agreement, by operation of law or otherwise, without our prior written consent. Any attempt by you to assign or transfer this Agreement without our prior written consent shall be null and void. We may freely assign or transfer this Agreement. Subject to the foregoing, this Agreement will bind and inure to the benefit of the parties, their successors and permitted assigns.
                </p>

                <h3 className="text-xl font-semibold text-foreground">9.3 Not Registered with the SEC or Any Other Agency</h3>
                <p>
                  We are not registered with the U.S. Securities and Exchange Commission as a national securities exchange or in any other capacity. You understand and acknowledge that we do not broker trading orders on your behalf. We also do not facilitate the execution or settlement of your trades, which occur entirely on public distributed blockchains like Ethereum. As a result, we do not (and cannot) guarantee market best pricing or best execution through our Products or when using our Auto Routing feature, which routes trades across liquidity pools on the Protocol only. Any references in a Product to "best price" does not constitute a representation or warranty about pricing available through such Product, on the Protocol, or elsewhere.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
