import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Limpi - Gestión de Stock",
  description: "Una aplicación para gestionar productos y ventas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main className="container mx-auto px-4 py-6">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
