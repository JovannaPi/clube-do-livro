import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clube do Livro ♥",
  description: "Diário de leitura do nosso clube",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fdf8f5] dark:bg-zinc-950 transition-colors duration-200">{children}</body>
    </html>
  );
}