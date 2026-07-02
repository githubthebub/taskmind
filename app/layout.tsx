import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "taskmind — piti, jhana & somatic practice",
  description:
    "A contemplative practice app for cultivating piti (rapture), approaching jhana absorption, and working with the body's energy through breath and somatic awareness.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "taskmind",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2027",
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col bg-[#081416] text-teal-50">
        <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-teal-900/40 bg-[#081416]/90 px-6 py-4 backdrop-blur">
          <Link href="/" className="text-sm font-semibold tracking-wide text-teal-50">
            taskmind
          </Link>
          <div className="flex items-center gap-6 text-sm text-teal-200/70">
            <Link href="/" className="transition hover:text-teal-100">
              Home
            </Link>
            <Link href="/progress" className="transition hover:text-teal-100">
              Progress
            </Link>
          </div>
        </nav>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
