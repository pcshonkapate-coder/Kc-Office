import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Kapate OS 3.0 — Enterprise Business Operating System',
  description: 'Unified Management Operating System for Kapate Consultancy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
