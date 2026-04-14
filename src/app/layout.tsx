import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EVEChat from "@/components/EVEChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The E.V.E. Studio",
  description: "VIBE writes your scripts. E.V.E. powers your edit. All you need to do is film.",
  icons: {
    icon: [
      { url: '/logo-icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/logo-icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/logo-icon.png', sizes: '180x180' }],
    shortcut: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <EVEChat />
      </body>
    </html>
  );
}
