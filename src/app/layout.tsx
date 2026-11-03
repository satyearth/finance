import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Satyfinance — Personal Wealth Workspace",
  description: "Personal finance workspace with intelligent expense tracking, calendar forecasting, and spending analytics.",
  keywords: ["personal finance", "expense tracker", "budget", "finance analytics", "satyfinance"],
  authors: [{ name: "Satyarth" }],
};

/**
 * Root application layout establishing global HTML structure and Satyfinance design system.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-[#1B1A18] antialiased selection:bg-[#E65B3F] selection:text-white min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
