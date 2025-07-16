import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"

import { EntryFeeProvider } from "@/lib/hooks/use-entry-fee"
import QueryProvider from "../components/QueryProvider"
import { LanguageProvider } from "@/lib/language-context"
import { MobileMenuProvider } from "@/lib/mobile-menu-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stele - Decentralized Investment Challenge Platform",
  description: "A decentralized investment challenge platform for testing cryptocurrency investment strategies",
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-muted/10 dark:bg-muted/10`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <EntryFeeProvider>
                <MobileMenuProvider>
                  <div className="flex flex-col min-h-screen bg-muted/40">
                    <Header />
                    <main className="flex-1 p-4 md:p-6">
                      {children}
                    </main>
                  </div>
                </MobileMenuProvider>
              </EntryFeeProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  )
}
