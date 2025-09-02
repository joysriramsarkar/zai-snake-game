import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shohidJabbar = localFont({
  src: '../fonts/ShohidJabbar.ttf',
  display: 'swap',
  variable: '--font-shohid-jabbar',
})

const shohidShafiur = localFont({
  src: '../fonts/ShohidShafiur.ttf',
  display: 'swap',
  variable: '--font-shohid-shafiur',
})

export const metadata: Metadata = {
  title: "সাপের খেলা",
  description: "Next.js দিয়ে তৈরি একটি ক্লাসিক সাপের খেলা।",
  icons: "/favicon.ico", // public ফোল্ডারে থাকা favicon.ico ফাইল
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shohidJabbar.variable} ${shohidShafiur.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
