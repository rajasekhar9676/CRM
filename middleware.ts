import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard and related routes
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
    '/settings/:path*'
  ]
}
