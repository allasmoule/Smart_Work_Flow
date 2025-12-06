import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Footer } from '@/components/Footer';
import { GlobalChat } from '@/components/GlobalChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartWorkFlow - Task Management System',
  description: 'Real-time task management and workflow system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <GlobalChat />
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
