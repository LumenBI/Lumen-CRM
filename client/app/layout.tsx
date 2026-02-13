import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

import { ThemeProvider } from "@/components/ThemeProvider";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Star CRM | Star Cargo",
  description: "Sistema de Gestión Logística Inteligente - Gestiona prospectos, citas y oportunidades de venta",
  keywords: "CRM, Star Cargo, gestión de clientes, ventas, seguimientos, logística",
  icons: {
    icon: "/logos/star-logo-w.png",
    shortcut: "/logos/star-logo-w.png",
    apple: "/logos/star-logo-w.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${mulish.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
