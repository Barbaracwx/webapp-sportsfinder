import type { Metadata } from "next";
import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Telegram Mini App',
  description: 'A simple Telegram mini app using Next.js and Prisma',
};

// Component to initialize Telegram Web App
function TelegramWebAppInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Initialize the Telegram Web App
      window.Telegram.WebApp.ready();

      // Optionally, expand the Web App to full screen
      window.Telegram.WebApp.expand();
    }
  }, []);

  return null; // This component doesn't render anything
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Load the Telegram Web App script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive" // Load the script before the page is interactive
        />

        {/* Initialize the Telegram Web App */}
        <TelegramWebAppInitializer />

        {/* Render the children (pages) */}
        {children}
      </body>
    </html>
  );
}