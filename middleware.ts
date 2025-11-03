import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy for Twitter Pixel and Blockchain APIs
  const cspHeader = `
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.ads-twitter.com https://ads-twitter.com https://ads-api.twitter.com https://analytics.twitter.com https://vercel.live;
    connect-src 'self' https://static.ads-twitter.com https://ads-twitter.com https://ads-api.twitter.com https://analytics.twitter.com https://*.infura.io https://mainnet.infura.io https://arbitrum-mainnet.infura.io https://*.etherscan.io https://api.etherscan.io https://api-arbitrum.arbiscan.io https://*.uniswap.org https://*.thegraph.com https://gateway.thegraph.com https://api.studio.thegraph.com https://arb1.arbitrum.io wss://*.infura.io;
    img-src 'self' data: blob: https: https://static.ads-twitter.com https://ads-twitter.com https://ads-api.twitter.com https://analytics.twitter.com;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
