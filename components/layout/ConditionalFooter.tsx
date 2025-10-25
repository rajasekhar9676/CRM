'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on dashboard pages or admin pages
  const hideFooter = pathname?.startsWith('/dashboard') || 
                    pathname?.startsWith('/admin') ||
                    pathname?.startsWith('/customers') ||
                    pathname?.startsWith('/orders') ||
                    pathname?.startsWith('/invoices') ||
                    pathname?.startsWith('/settings') ||
                    pathname?.startsWith('/pricing');
  
  if (hideFooter) {
    return null;
  }
  
  return <Footer />;
}
