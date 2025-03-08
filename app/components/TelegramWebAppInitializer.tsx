// components/TelegramWebAppInitializer.tsx
"use client"; // Mark this component as a Client Component

import { useEffect } from 'react';

export default function TelegramWebAppInitializer() {
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