import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Clube do Livro ♥",
  description: "Diário de leitura do nosso clube",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clube do Livro",
  },
};

export const viewport: Viewport = {
  themeColor: "#e07a5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-[#fdf8f5] dark:bg-zinc-950 transition-colors duration-200">{children}</body>
    </html>
  );
}