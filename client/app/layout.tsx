import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Star CRM | Star Cargo",
  description: "Sistema de Gestión Logística Inteligente - Gestiona prospectos, citas y oportunidades de venta",
  keywords: "CRM, Star Cargo, gestión de clientes, ventas, logística",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${mulish.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
