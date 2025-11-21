import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { QueryProvider } from '@/lib/providers/query-provider'
import { AuthProvider } from '@/lib/providers/auth-provider'

export const metadata: Metadata = {
  title: 'ACIMS - Automated Canteen & Inventory Management System',
  description: 'Comprehensive canteen and inventory management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
