// TEMPORARILY DISABLED MIDDLEWARE TO FORCE CLEAN DEPLOYMENT
// This will be re-enabled after Vercel cache clears

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Allow all requests to pass through for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/orders/:path*',
    '/invoices/:path*',
    '/settings/:path*',
    '/admin/:path*'
  ]
}
