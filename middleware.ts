import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Handle admin routes - redirect to admin login if not authenticated
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!req.nextauth.token) {
        const signInUrl = new URL('/auth/admin-signin', req.url)
        signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
        return NextResponse.redirect(signInUrl)
      }
    }
    
    // Handle user routes - redirect to homepage with auth modal if not authenticated
    if (req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/customers') ||
        req.nextUrl.pathname.startsWith('/orders') ||
        req.nextUrl.pathname.startsWith('/invoices') ||
        req.nextUrl.pathname.startsWith('/settings')) {
      if (!req.nextauth.token) {
        // Simple redirect to home page - let client handle the callback URL
        return NextResponse.redirect(new URL('/?auth=login', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For admin routes, we handle redirects in the middleware function above
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return true // Let the middleware function handle the redirect
        }
        
        // Protect other routes that require authentication
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/customers') ||
            req.nextUrl.pathname.startsWith('/orders') ||
            req.nextUrl.pathname.startsWith('/invoices') ||
            req.nextUrl.pathname.startsWith('/settings')) {
          return !!token
        }
        return true
      },
    },
  }
)

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
