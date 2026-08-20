import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SupabaseAuthListener } from "@/components/SupabaseAuthListener";
// import { WelcomePopup } from "@/components/WelcomePopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahil Cutz — Premium Barber SaaS",
  description: "Luxury barber appointment management and booking platform built with Next.js, Supabase, and modern UI.",
  metadataBase: new URL('https://sahilcutzz.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <SupabaseAuthListener />
          {/* <WelcomePopup /> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}