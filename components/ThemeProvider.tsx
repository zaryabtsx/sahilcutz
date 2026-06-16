"use client";

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="theme"           // Helps with consistency
      themes={['light', 'dark']}   // Optional but recommended
    >
      {children}
    </NextThemesProvider>
  );
}