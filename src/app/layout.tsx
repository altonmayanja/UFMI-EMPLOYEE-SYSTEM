import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UFMI Portal - Operations Dashboard",
  description: "Uganda Federation of Movie Industry Operations Portal. Submit, track, and manage daily work reports.",
  keywords: ["UFMI", "daily report", "employee management", "operations portal", "Uganda Federation of Movie Industry"],
  authors: [{ name: "Uganda Federation of Movie Industry" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UFMI Portal - Operations Dashboard",
    description: "Uganda Federation of Movie Industry Operations Portal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=mic,mic_off,stop&display=optional" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
