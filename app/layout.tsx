import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthProvider'
import { SubscriptionProvider } from '@/context/SubscriptionProvider'
import { Toaster } from '@/components/ui/toaster'
import { WhatsAppFloat } from '@/components/ui/whatsapp-float'
import { WHATSAPP_CONFIG } from '@/lib/whatsapp-config'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BizMitra - Customer Management',
  description: 'A simple CRM for managing customers, orders, and invoices',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BizMitra',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SubscriptionProvider>
            {children}
            <Footer />
            <Toaster />
            <WhatsAppFloat 
              phoneNumber={WHATSAPP_CONFIG.phoneNumber} 
              message={WHATSAPP_CONFIG.defaultMessage} 
            />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}