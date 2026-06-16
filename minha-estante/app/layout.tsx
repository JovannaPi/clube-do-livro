import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minha Estante 💜",
  description: "Minha estante pessoal de leituras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-[#faf9ff] dark:bg-[#0f0d1a] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}