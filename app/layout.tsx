import type { Metadata } from 'next';
import '@/styles/globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'AutoBizOps – Autonomous Business Operations Agent',
  description: 'AI-powered web agent that performs real business workflows. Built for TinyFish Web Agent Hackathon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-900 text-green-100 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
