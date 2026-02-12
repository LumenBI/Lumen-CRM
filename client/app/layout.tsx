<<<<<<< HEAD
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Star CRM | Star Cargo',
    description: 'Sistema de Gestión Logística Inteligente',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    )
=======
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Star CRM - Sistema de Gestión de Clientes",
  description: "Sistema de gestión de relaciones con clientes de Star Cargo - Gestiona prospectos, citas y oportunidades de venta",
  keywords: "CRM, Star Cargo, gestión de clientes, ventas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${mulish.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
}
