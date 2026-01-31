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
}
