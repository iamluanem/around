import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource-variable/inter';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/layout/Toaster';

export const metadata: Metadata = {
  title: 'AROUND | Your stay is just the beginning',
  description: 'An AI-powered experience intelligence layer for travel marketplaces. Independent proof of concept.',
};
export const viewport: Viewport = { themeColor: '#FBF8F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
