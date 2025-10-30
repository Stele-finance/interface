/* eslint-disable react/no-unescaped-entities */
"use client"

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-muted/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stele Finance Privacy Policy
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Last modified: Oct 30, 2025
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-muted/40 border-border/50">
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-8" suppressHydrationWarning>

              {/* Summary */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Summary</h2>
                <p className="font-semibold text-lg">
                  Stele Finance does not collect, store, or process any personal data.
                </p>
                <p>
                  We use localStorage only to cache real-time token prices for faster, smoother user experience.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do not collect personal information (name, email, IP address, wallet address, etc.).</li>
                  <li>We do not use cookies, analytics, or tracking pixels.</li>
                  <li>All on-chain data is fetched via The Graph.</li>
                  <li>You interact directly with the Stele Protocol using your own wallet.</li>
                  <li>Privacy risk = zero.</li>
                </ul>
              </div>

              {/* Data We Do Not Collect */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Data We Do Not Collect</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-4 py-2 text-left font-semibold">Category</th>
                        <th className="border border-border px-4 py-2 text-left font-semibold">Collected?</th>
                        <th className="border border-border px-4 py-2 text-left font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border px-4 py-2">Personal Information (name, email, phone, etc.)</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Never requested or stored</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border border-border px-4 py-2">IP Address</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">No server logs</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">Wallet Address</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Only displayed from your connection; not stored</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border border-border px-4 py-2">Cookies</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Not used</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">Analytics (Google, Mixpanel, etc.)</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Not implemented</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="border border-border px-4 py-2">Email Subscriptions</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Not offered</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">Customer Support Logs</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">No ticketing system</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Stored in localStorage */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Data Stored in localStorage (Not Personal Data)</h2>
                <p>
                  We use browser localStorage only to cache real-time token prices for the following user benefit:
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-4 py-2 text-left font-semibold">Data</th>
                        <th className="border border-border px-4 py-2 text-left font-semibold">Purpose</th>
                        <th className="border border-border px-4 py-2 text-left font-semibold">Personal?</th>
                        <th className="border border-border px-4 py-2 text-left font-semibold">Persisted?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border px-4 py-2">Token Prices (e.g., ETH/USD)</td>
                        <td className="border border-border px-4 py-2">Faster price loading on return visits</td>
                        <td className="border border-border px-4 py-2">No</td>
                        <td className="border border-border px-4 py-2">Yes (until cleared)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  This is public market data, not tied to your identity, wallet, or behavior.
                </p>
                <p>
                  It is automatically cleared when you clear your browser cache.
                </p>
                <p>
                  You can disable it anytime via browser settings.
                </p>
              </div>

              {/* Data Displayed (Not Collected) */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Data Displayed (Not Collected)</h2>
                <p>
                  The Interface displays public on-chain data via The Graph, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Wallet address (when connected)</li>
                  <li>Transaction history</li>
                  <li>Token balances</li>
                  <li>Challenge info</li>
                  <li>Fund info</li>
                </ul>
                <p>
                  Stele Finance does not create, own, store, or control this data.
                </p>
              </div>

              {/* The Graph */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">The Graph</h2>
                <p>
                  <a href="https://thegraph.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">The Graph</a> is a decentralized indexing protocol.
                </p>
                <p>
                  We use public subgraphs only — no user tracking or profiling.
                </p>
              </div>

              {/* Data Sharing */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Data Sharing</h2>
                <p className="font-semibold">None.</p>
                <p>
                  No personal data is collected → nothing to share, sell, or disclose.
                </p>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Security</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>No personal data stored → no breach risk from Stele.</li>
                  <li>localStorage price cache is public data only and client-side.</li>
                  <li>Your wallet and keys remain 100% under your control.</li>
                </ul>
              </div>

              {/* Age Requirements */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Age Requirements</h2>
                <p>
                  Services are for users 18+.
                </p>
                <p>
                  We do not collect data from children.
                </p>
              </div>

              {/* Changes to This Policy */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Changes to This Policy</h2>
                <p>
                  Material changes will be posted here with an updated date.
                </p>
                <p>
                  Continued use = acceptance.
                </p>
              </div>

              {/* Contact Us */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                <p>
                  <strong>Email:</strong> stelefinance@gmail.com<br />
                  <strong>Website:</strong> <a href="https://stele.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://stele.io</a>
                </p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
