import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { StoreConfigProvider } from "./components/StoreConfigProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Gestión",
  description: "Una aplicación para gestionar productos y ventas.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <StoreConfigProvider>
          <Navbar>
            <main className="container mx-auto px-4 py-6">{children}</main>
          </Navbar>
          <Toaster richColors position="top-right" />
        </StoreConfigProvider>
      </body>
    </html>
  );
}
